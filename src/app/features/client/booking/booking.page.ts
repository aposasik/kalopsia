import { Component, inject, OnInit, signal } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonFooter,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { TranslocoPipe } from '@jsverse/transloco';

import { Service, Stylist } from '../../../core/data/salon-gateway';
import { BookingStore, slotsFor } from './booking.store';
import { Router } from '@angular/router';

type Sheet = 'stylist' | 'time' | 'summary' | null;

@Component({
  selector: 'app-booking',
  providers: [BookingStore],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonFooter,
    IonButton,
    IonModal,
    IonInput,
    TranslocoPipe,
  ],
  templateUrl: './booking.page.html',
  styleUrl: './booking.page.scss',
})
export class BookingPage implements OnInit {
  readonly store = inject(BookingStore);
  readonly sheet = signal<Sheet>(null);
  readonly done = signal(false);
  readonly name = signal('');
  readonly phone = signal('');
  /** Το κλειδί μετάφρασης του μηνύματος λάθους, ή null. */
  readonly problem = signal<string | null>(null);
  private readonly router = inject(Router); // import { Router } from '@angular/router';

  ngOnInit(): void {
    void this.store.load();
  }

  pickService(service: Service): void {
        if (service.byRequest) {
      void this.router.navigate(['/request', service.id]); // μεγάλη αλλαγή: αίτημα με selfie αντί για ώρα
      return;
    }
    this.done.set(false);
    this.store.selectService(service);
    this.sheet.set('stylist');
  }

  pickStylist(stylist: Stylist): void {
    void this.store.selectStylist(stylist);
    this.sheet.set('time');
  }

  /** Έχει η μέρα έστω μία ελεύθερη ώρα; Αν όχι, το κουμπί της βγαίνει αχνό. */
  hasSlots(day: Date): boolean {
    const service = this.store.service();
    const stylist = this.store.stylist();
    return (
      !!service &&
      !!stylist &&
      slotsFor(service, this.store.hours(), this.store.busy(), day).length > 0
    );
  }

  /** Όνομα με 2+ γράμματα και τηλέφωνο με 10+ ψηφία: τα ίδια όρια με τη βάση. */
  canBook(): boolean {
    return this.name().trim().length >= 2 && this.phone().replace(/\D/g, '').length >= 10;
  }

  async confirm(): Promise<void> {
    this.problem.set(null);
    const result = await this.store.book(this.name().trim(), this.phone().trim());
    if (result.ok) {
      this.sheet.set(null);
      this.done.set(true);
    } else if (result.reason === 'taken') {
      this.problem.set('booking.taken');
      this.sheet.set('time'); // πίσω στις ώρες: η πιασμένη έχει φύγει από τη λίστα
    } else {
      this.problem.set(result.reason === 'closed' ? 'booking.closed' : 'booking.failed');
    }
  }

  euro(cents: number): string {
    return (cents / 100).toFixed(2).replace('.', ',') + ' €';
  }

  dayLabel(day: Date): string {
    return day.toLocaleDateString('el-GR', { weekday: 'short', day: 'numeric', month: 'numeric' });
  }

  timeLabel(slot: Date): string {
    return slot.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
}
