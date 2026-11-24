import { Injectable } from '@angular/core';

import { Interval, overlaps } from '../domain/interval';
import {
  BookingRequest,
  BookingResult,
  OpeningHours,
  Salon,
  SalonGateway,
  Service,
  Stylist,
} from './salon-gateway';

export const SERVICES: Service[] = [
  { id: 'cut', name: 'Κούρεμα', priceCents: 2000, durationMin: 30, depositRate: 0.3 },
  { id: 'color', name: 'Βαφή', priceCents: 4500, durationMin: 90, depositRate: 0.3 },
  { id: 'balayage', name: 'Balayage', priceCents: 9000, durationMin: 180, depositRate: 0.3 },
];

export const STYLISTS: Stylist[] = [
  { id: 'maria', name: 'Μαρία' },
  { id: 'nikos', name: 'Νίκος' },
];

/** Τρίτη (2) έως Σάββατο (6), 10:00–18:00. Κυριακή και Δευτέρα δεν έχουν γραμμή: κλειστά. */
export const HOURS: OpeningHours[] = [2, 3, 4, 5, 6].map((weekday) => ({
  weekday,
  open: '10:00',
  close: '18:00',
}));

const at = (day: Date, h: number) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), h);

/** Η demo «βάση»: ζει στη μνήμη και χάνεται με το F5. Συμπεριφέρεται όπως η αληθινή. */
@Injectable()
export class DemoSalonGateway extends SalonGateway {
  private readonly booked: { stylistId: string; slot: Interval }[] = [];

  async loadSalon(): Promise<Salon> {
    return { services: SERVICES, stylists: STYLISTS, hours: HOURS };
  }

  /** Η Μαρία είναι κλεισμένη 12:00–14:00 και ο Νίκος 10:00–11:00 κάθε μέρα, συν ό,τι κλείστηκε τώρα. */
  async loadBusy(stylistId: string, from: Date, to: Date): Promise<Interval[]> {
    const busy: Interval[] = [];
    for (
      let day = new Date(from);
      day < to;
      day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
    ) {
      busy.push(
        stylistId === 'maria'
          ? { start: at(day, 12), end: at(day, 14) }
          : { start: at(day, 10), end: at(day, 11) },
      );
    }
    return [...busy, ...this.booked.filter((b) => b.stylistId === stylistId).map((b) => b.slot)];
  }

  async book(request: BookingRequest): Promise<BookingResult> {
    const service = SERVICES.find((s) => s.id === request.serviceId);
    if (!service) {
      return { ok: false, reason: 'failed' };
    }
    const slot: Interval = {
      start: request.start,
      end: new Date(request.start.getTime() + service.durationMin * 60000),
    };
    const day = at(request.start, 0);
    const busy = await this.loadBusy(request.stylistId, day, at(request.start, 24));
    if (busy.some((b) => overlaps(b, slot))) {
      return { ok: false, reason: 'taken' }; // ο ίδιος κανόνας με το EXCLUDE της βάσης
    }
    this.booked.push({ stylistId: request.stylistId, slot });
    return { ok: true, id: `demo-${this.booked.length}` };
  }
}
