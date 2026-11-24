import { TestBed } from '@angular/core/testing';

import { SUPABASE } from './supabase';
import { SupabaseSalonGateway } from './supabase-salon';

/** Ψεύτικος client: απαντά ό,τι του πούμε, χωρίς δίκτυο. Θυμάται με τι τον κάλεσαν. */
function fakeClient(answers: {
  tables?: Record<string, unknown[]>;
  rpc?: { data: unknown; error: { code: string; message: string } | null };
}) {
  const calls: { fn: string; args: unknown }[] = [];
  return {
    calls,
    from: (table: string) => ({
      select: () => ({ order: async () => ({ data: answers.tables?.[table] ?? [], error: null }) }),
    }),
    rpc: async (fn: string, args: unknown) => {
      calls.push({ fn, args });
      return answers.rpc ?? { data: null, error: null };
    },
  };
}

function setup(client: ReturnType<typeof fakeClient>) {
  TestBed.configureTestingModule({
    providers: [SupabaseSalonGateway, { provide: SUPABASE, useValue: client }],
  });
  return TestBed.inject(SupabaseSalonGateway);
}

describe('SupabaseSalonGateway', () => {
  const request = {
    serviceId: 's1',
    stylistId: 'm1',
    start: new Date('2030-01-08T12:00:00Z'),
    name: 'Άννα Δοκιμή',
    phone: '6900000001',
  };

  it('turns database rows into the app model', async () => {
    const gateway = setup(
      fakeClient({
        tables: {
          services: [
            { id: 's1', name: 'Βαφή', price_cents: 4500, duration_min: 90, deposit_rate: '0.30' },
          ],
          stylists: [{ id: 'm1', name: 'Μαρία' }],
          opening_hours: [{ weekday: 2, open_time: '10:00:00', close_time: '18:00:00' }],
        },
      }),
    );
    const salon = await gateway.loadSalon();
    expect(salon.services[0]).toEqual({
      id: 's1',
      name: 'Βαφή',
      priceCents: 4500,
      durationMin: 90,
      depositRate: 0.3,
    });
    expect(salon.hours[0]).toEqual({ weekday: 2, open: '10:00', close: '18:00' });
  });

  it('busy rows become intervals of Dates', async () => {
    const gateway = setup(
      fakeClient({
        rpc: {
          data: [{ starts_at: '2030-01-08T10:00:00+00:00', ends_at: '2030-01-08T11:00:00+00:00' }],
          error: null,
        },
      }),
    );
    const busy = await gateway.loadBusy(
      'm1',
      new Date('2030-01-08T00:00:00Z'),
      new Date('2030-01-09T00:00:00Z'),
    );
    expect(busy).toEqual([
      { start: new Date('2030-01-08T10:00:00Z'), end: new Date('2030-01-08T11:00:00Z') },
    ]);
  });

  it('book sends the choices to book_appointment and returns the new id', async () => {
    const client = fakeClient({ rpc: { data: 'new-id', error: null } });
    const result = await setup(client).book(request);
    expect(result).toEqual({ ok: true, id: 'new-id' });
    expect(client.calls[0]).toEqual({
      fn: 'book_appointment',
      args: {
        p_service: 's1',
        p_stylist: 'm1',
        p_starts_at: '2030-01-08T12:00:00.000Z',
        p_name: 'Άννα Δοκιμή',
        p_phone: '6900000001',
      },
    });
  });

  it('error 23P01 (the EXCLUDE rule) means the slot was taken', async () => {
    const gateway = setup(
      fakeClient({
        rpc: {
          data: null,
          error: { code: '23P01', message: 'conflicting key value violates exclusion constraint' },
        },
      }),
    );
    expect(await gateway.book(request)).toEqual({ ok: false, reason: 'taken' });
  });

  it('error KP003 means outside opening hours, anything else is a plain failure', async () => {
    const closed = setup(
      fakeClient({
        rpc: { data: null, error: { code: 'KP003', message: 'outside opening hours' } },
      }),
    );
    expect(await closed.book(request)).toEqual({ ok: false, reason: 'closed' });
    TestBed.resetTestingModule();
    const broken = setup(
      fakeClient({ rpc: { data: null, error: { code: '08006', message: 'connection failure' } } }),
    );
    expect(await broken.book(request)).toEqual({ ok: false, reason: 'failed' });
  });
});
