export type Channel = 'viber' | 'whatsapp' | 'phone';

export interface SelfieRequest {
  serviceId: string;
  wish: string; // τι θέλει να κάνει
  preferred: string; // ποιες μέρες και ώρες τον βολεύουν
  channel: Channel; // πού θέλει να του απαντήσουν
  name: string;
  phone: string;
  consent: boolean; // συμφώνησε να σταλεί η φωτογραφία του στο μαγαζί
}

/** upload = δεν ανέβηκε η φωτογραφία · failed = δεν γράφτηκε το αίτημα. */
export type RequestResult = { ok: true } | { ok: false; reason: 'upload' | 'failed' };

export abstract class RequestGateway {
  abstract send(request: SelfieRequest, photo: Blob): Promise<RequestResult>;
}
