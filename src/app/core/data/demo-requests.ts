import { Injectable } from '@angular/core';

import { RequestGateway, RequestResult, SelfieRequest } from './request-gateway';

/** Demo: κρατά τα αιτήματα στη μνήμη. Η φωτογραφία δεν φεύγει από τη συσκευή. */
@Injectable()
export class DemoRequestGateway extends RequestGateway {
  readonly sent: { request: SelfieRequest; photoBytes: number }[] = [];

  async send(request: SelfieRequest, photo: Blob): Promise<RequestResult> {
    if (!request.consent) {
      return { ok: false, reason: 'failed' }; // όπως η βάση: χωρίς συγκατάθεση τίποτα
    }
    this.sent.push({ request, photoBytes: photo.size });
    return { ok: true };
  }
}
