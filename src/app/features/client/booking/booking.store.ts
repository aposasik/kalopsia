import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import {
  BookingResult,
  OpeningHours,
  SalonGateway,
  Service,
  Stylist,
} from '../../../core/data/salon-gateway';
import { depositFor } from '../../../core/domain/deposit';
import { Interval } from '../../../core/domain/interval';
import { freeSlots } from '../../../core/domain/slots';

export const STEP_MIN = 30;
export const DAYS_AHEAD = 7;

interface BookingState {
  services: Service[];
  stylists: Stylist[];
  hours: OpeningHours[];
  busy: Interval[]; // τα πιασμένα του επιλεγμένου κομμωτή, για τις μέρες που δείχνουμε
  days: Date[]; // οι μέρες που δείχνουμε, η καθεμία στα μεσάνυχτα
  service: Service | null;
  stylist: Stylist | null;
  day: Date | null;
  slot: Date | null;
}

const initialState: BookingState = {
  services: [],
  stylists: [],
  hours: [],
  busy: [],
  days: [],
  service: null,
  stylist: null,
  day: null,
  slot: null,
};

/** Οι επόμενες count μέρες από τη from, η καθεμία στα μεσάνυχτα (τοπική ώρα). */
export function nextDays(from: Date, count: number): Date[] {
  return Array.from(
    { length: count },
    (_, i) => new Date(from.getFullYear(), from.getMonth(), from.getDate() + i),
  );
}

/** Πότε είναι ανοιχτά τη μέρα day. Κλειστά: null. */
export function openOn(hours: OpeningHours[], day: Date): Interval | null {
  const row = hours.find((h) => h.weekday === day.getDay());
  if (!row) {
    return null;
  }
  const at = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
  };
  return { start: at(row.open), end: at(row.close) };
}

/** Οι ελεύθερες ώρες μιας υπηρεσίας μια συγκεκριμένη μέρα. Κλειστή μέρα: καμία. */
export function slotsFor(
  service: Service,
  hours: OpeningHours[],
  busy: Interval[],
  day: Date,
): Date[] {
  const open = openOn(hours, day);
  return open ? freeSlots({ open, busy, durationMin: service.durationMin, stepMin: STEP_MIN }) : [];
}

export const BookingStore = signalStore(
  withState(initialState),
  withComputed(({ service, stylist, hours, busy, day, slot }) => ({
    depositCents: computed(() => {
      const s = service();
      return s ? depositFor(s.priceCents, s.depositRate) : 0;
    }),
    slots: computed(() => {
      const s = service();
      const d = day();
      return s && stylist() && d ? slotsFor(s, hours(), busy(), d) : [];
    }),
    canConfirm: computed(() => !!(service() && stylist() && day() && slot())),
  })),
  withMethods((store, gateway = inject(SalonGateway)) => {
    const loadBusy = async (stylist: Stylist): Promise<void> => {
      const days = store.days();
      const busy = await gateway.loadBusy(
        stylist.id,
        days[0],
        nextDays(days[days.length - 1], 2)[1],
      );
      patchState(store, { busy });
    };
    return {
      /** Φέρνει τιμοκατάλογο, κομμωτές και ωράριο. Το today μπαίνει απ' έξω για να τεστάρεται. */
      async load(today = new Date()): Promise<void> {
        const salon = await gateway.loadSalon();
        patchState(store, { ...salon, days: nextDays(today, DAYS_AHEAD) });
      },
      selectService(service: Service): void {
        patchState(store, { service, slot: null });
      },
      async selectStylist(stylist: Stylist): Promise<void> {
        patchState(store, { stylist, slot: null, busy: [] });
        await loadBusy(stylist);
      },
      selectDay(day: Date): void {
        patchState(store, { day, slot: null });
      },
      selectSlot(slot: Date): void {
        patchState(store, { slot });
      },
      /** Στέλνει την κράτηση. Αν την ώρα την πρόλαβε άλλος, ξαναφέρνει τα πιασμένα για να φύγει από τη λίστα. */
      async book(name: string, phone: string): Promise<BookingResult> {
        const service = store.service();
        const stylist = store.stylist();
        const slot = store.slot();
        if (!service || !stylist || !slot) {
          return { ok: false, reason: 'failed' };
        }
        const result = await gateway.book({
          serviceId: service.id,
          stylistId: stylist.id,
          start: slot,
          name,
          phone,
        });
        if (result.ok) {
          patchState(store, { service: null, stylist: null, day: null, slot: null, busy: [] });
        } else if (result.reason === 'taken') {
          patchState(store, { slot: null });
          await loadBusy(stylist);
        }
        return result;
      },
    };
  }),
);
