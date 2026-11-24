import { inject, Injectable } from '@angular/core';

import { Interval } from '../domain/interval';
import { BookingRequest, BookingResult, Salon, SalonGateway } from './salon-gateway';
import { SUPABASE } from './supabase';

// Οι γραμμές όπως έρχονται από τη βάση: ονόματα στηλών με κάτω παύλα.
interface ServiceRow {
  id: string;
  name: string;
  price_cents: number;
  duration_min: number;
  deposit_rate: number;
}
interface StylistRow {
  id: string;
  name: string;
}
interface HoursRow {
  weekday: number;
  open_time: string;
  close_time: string;
}
interface BusyRow {
  starts_at: string;
  ends_at: string;
}

/** Οι κωδικοί σφάλματος που μας ενδιαφέρουν. Ο 23P01 είναι της Postgres, οι KP… της book_appointment. */
const TAKEN = '23P01';
const CLOSED = ['KP002', 'KP003'];

@Injectable()
export class SupabaseSalonGateway extends SalonGateway {
  private readonly db = inject(SUPABASE);

  async loadSalon(): Promise<Salon> {
    const [services, stylists, hours] = await Promise.all([
      this.db
        .from('services')
        .select('id, name, price_cents, duration_min, deposit_rate')
        .order('price_cents'),
      this.db.from('stylists').select('id, name').order('name'),
      this.db.from('opening_hours').select('weekday, open_time, close_time').order('weekday'),
    ]);
    const error = services.error ?? stylists.error ?? hours.error;
    if (error) {
      throw new Error(error.message);
    }
    return {
      services: (services.data as ServiceRow[]).map((r) => ({
        id: r.id,
        name: r.name,
        priceCents: r.price_cents,
        durationMin: r.duration_min,
        depositRate: Number(r.deposit_rate),
      })),
      stylists: stylists.data as StylistRow[],
      // Η Postgres δίνει '10:00:00'. Κρατάμε το '10:00'.
      hours: (hours.data as HoursRow[]).map((r) => ({
        weekday: r.weekday,
        open: r.open_time.slice(0, 5),
        close: r.close_time.slice(0, 5),
      })),
    };
  }

  async loadBusy(stylistId: string, from: Date, to: Date): Promise<Interval[]> {
    const { data, error } = await this.db.rpc('busy_slots', {
      p_stylist: stylistId,
      p_from: from.toISOString(),
      p_to: to.toISOString(),
    });
    if (error) {
      throw new Error(error.message);
    }
    return (data as BusyRow[]).map((r) => ({
      start: new Date(r.starts_at),
      end: new Date(r.ends_at),
    }));
  }

  async book(request: BookingRequest): Promise<BookingResult> {
    const { data, error } = await this.db.rpc('book_appointment', {
      p_service: request.serviceId,
      p_stylist: request.stylistId,
      p_starts_at: request.start.toISOString(),
      p_name: request.name,
      p_phone: request.phone,
    });
    if (!error) {
      return { ok: true, id: data as string };
    }
    if (error.code === TAKEN) {
      return { ok: false, reason: 'taken' };
    }
    return { ok: false, reason: CLOSED.includes(error.code) ? 'closed' : 'failed' };
  }
}
