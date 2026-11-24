import { Interval } from '../domain/interval';

export interface Service {
  id: string;
  name: string;
  priceCents: number;  // €20 = 2000
  durationMin: number;
  depositRate: number; // 0.3 = 30%
}

export interface Stylist {
  id: string;
  name: string;
}

/** Μία γραμμή του ωραρίου. weekday όπως το getDay(): 0 = Κυριακή. Μέρα χωρίς γραμμή = κλειστά. */
export interface OpeningHours {
  weekday: number;
  open: string;  // '10:00'
  close: string; // '18:00'
}

export interface Salon {
  services: Service[];
  stylists: Stylist[];
  hours: OpeningHours[];
}

export interface BookingRequest {
  serviceId: string;
  stylistId: string;
  start: Date;
  name: string;
  phone: string;
}

/** taken = την ώρα την πρόλαβε άλλος · closed = εκτός ωραρίου ή στο παρελθόν · failed = οτιδήποτε άλλο. */
export type BookingResult = { ok: true; id: string } | { ok: false; reason: 'taken' | 'closed' | 'failed' };

/**
 * Το συμβόλαιο: τι ζητά η εφαρμογή από «κάπου που έχει τα δεδομένα».
 * Οι οθόνες και το store ξέρουν μόνο αυτό. Ποιος απαντά (demo ή Supabase) ορίζεται στο main.ts.
 */
export abstract class SalonGateway {
  abstract loadSalon(): Promise<Salon>;
  /** Τα πιασμένα διαστήματα ενός κομμωτή από from έως to. */
  abstract loadBusy(stylistId: string, from: Date, to: Date): Promise<Interval[]>;
  abstract book(request: BookingRequest): Promise<BookingResult>;
}