import { TestBed } from '@angular/core/testing';

import { SelfieRequest } from './request-gateway';
import { SUPABASE } from './supabase';
import { SupabaseRequestGateway } from './supabase-requests';

type Fail = { message: string } | null;

/** Ψεύτικος client: θυμάται τι ανέβηκε και τι κλήθηκε, και αποτυγχάνει όπου του πούμε. */
function fakeClient(fail: { upload?: Fail; rpc?: Fail } = {}) {
  const uploads: { bucket: string; path: string; type: string | undefined }[] = [];
  const calls: { fn: string; args: Record<string, unknown> }[] = [];
  return {
    uploads,
    calls,
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, _file: Blob, options: { contentType?: string }) => {
          uploads.push({ bucket, path, type: options.contentType });
          return { data: null, error: fail.upload ?? null };
        },
      }),
    },
    rpc: async (fn: string, args: Record<string, unknown>) => {
      calls.push({ fn, args });
      return { data: null, error: fail.rpc ?? null };
    },
  };
}

function setup(client: ReturnType<typeof fakeClient>) {
  TestBed.configureTestingModule({
    providers: [SupabaseRequestGateway, { provide: SUPABASE, useValue: client }],
  });
  return TestBed.inject(SupabaseRequestGateway);
}

describe('SupabaseRequestGateway', () => {
  const photo = new Blob(['x'], { type: 'image/jpeg' });
  const request: SelfieRequest = {
    serviceId: 's3',
    wish: 'Θέλω ξανθές ανταύγειες',
    preferred: 'Πέμπτη πρωί',
    channel: 'viber',
    name: 'Άννα Δοκιμή',
    phone: '6900000001',
    consent: true,
  };

  it('uploads the photo as uuid.jpg, then creates the request that points to it', async () => {
    const client = fakeClient();
    expect(await setup(client).send(request, photo)).toEqual({ ok: true });
    expect(client.uploads[0].bucket).toBe('selfies');
    expect(client.uploads[0].path).toMatch(/^[0-9a-f-]{36}\.jpg$/);
    expect(client.uploads[0].type).toBe('image/jpeg');
    expect(client.calls[0].fn).toBe('create_request');
    expect(client.calls[0].args['p_photo_path']).toBe(client.uploads[0].path);
    expect(client.calls[0].args['p_consent']).toBe(true);
  });

  it('if the upload fails, no request is created', async () => {
    const client = fakeClient({
      upload: { message: 'new row violates row-level security policy' },
    });
    expect(await setup(client).send(request, photo)).toEqual({ ok: false, reason: 'upload' });
    expect(client.calls.length).toBe(0);
  });

  it('if the database refuses the request, the result is "failed"', async () => {
    const client = fakeClient({ rpc: { message: 'consent required' } });
    expect(await setup(client).send(request, photo)).toEqual({ ok: false, reason: 'failed' });
  });
});
