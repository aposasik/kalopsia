import { inject, Injectable } from '@angular/core';

import { RequestGateway, RequestResult, SelfieRequest } from './request-gateway';
import { SUPABASE } from './supabase';

@Injectable()
export class SupabaseRequestGateway extends RequestGateway {
  private readonly db = inject(SUPABASE);

  async send(request: SelfieRequest, photo: Blob): Promise<RequestResult> {
    // Πρώτα η φωτογραφία, με τυχαίο όνομα που δεν λέει τίποτα για τον πελάτη.
    const path = `${crypto.randomUUID()}.jpg`;
    const upload = await this.db.storage
      .from('selfies')
      .upload(path, photo, { contentType: 'image/jpeg' });
    if (upload.error) {
      return { ok: false, reason: 'upload' };
    }
    // Μετά το αίτημα, που δείχνει στη φωτογραφία.
    const { error } = await this.db.rpc('create_request', {
      p_service: request.serviceId,
      p_wish: request.wish,
      p_preferred: request.preferred,
      p_channel: request.channel,
      p_name: request.name,
      p_phone: request.phone,
      p_photo_path: path,
      p_consent: request.consent,
    });
    return error ? { ok: false, reason: 'failed' } : { ok: true };
  }
}
