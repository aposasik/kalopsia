import { TestBed } from '@angular/core/testing';

import { DemoSalonGateway, SERVICES, STYLISTS } from '../../../core/data/demo-salon';
import { SalonGateway } from '../../../core/data/salon-gateway';
import { BookingStore } from './booking.store';

describe('BookingStore', () => {
  const [cut, color] = SERVICES;
  const [maria, nikos] = STYLISTS;
  const tuesday = new Date(2026, 10, 17); // Τρίτη 17/11/2026 (ο μήνας μετράει από το 0)
  const sunday = new Date(2026, 10, 22);
  const hhmm = (d: Date) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;

  /** Store με το demo gateway, φορτωμένο σαν να είναι «σήμερα» η Τρίτη 17/11. */
  async function setup() {
    TestBed.configureTestingModule({
      providers: [BookingStore, { provide: SalonGateway, useClass: DemoSalonGateway }],
    });
    const store = TestBed.inject(BookingStore);
    await store.load(tuesday);
    return store;
  }

  it('load brings the price list and the next 7 days', async () => {
    const store = await setup();
    expect(store.services().length).toBe(3);
    expect(store.days().length).toBe(7);
    expect(store.days()[0]).toEqual(tuesday);
    expect(store.canConfirm()).toBe(false);
  });

  it('the deposit is 30% of the selected service', async () => {
    const store = await setup();
    store.selectService(color); // €45
    expect(store.depositCents()).toBe(1350);
  });

  it('Maria, haircut, Tuesday: 12:00-14:00 is taken', async () => {
    const store = await setup();
    store.selectService(cut);
    await store.selectStylist(maria);
    store.selectDay(tuesday);
    const times = store.slots().map(hhmm);
    expect(times).toContain('11:30');
    expect(times).not.toContain('12:00');
    expect(times).not.toContain('13:30');
    expect(times).toContain('14:00');
    expect(times.at(-1)).toBe('17:30');
  });

  it('a 90-minute colour does not fit at 11:00 before a 12:00 booking', async () => {
    const store = await setup();
    store.selectService(color);
    await store.selectStylist(maria);
    store.selectDay(tuesday);
    const times = store.slots().map(hhmm);
    expect(times).toContain('10:30');
    expect(times).not.toContain('11:00');
    expect(times.at(-1)).toBe('16:30');
  });

  it('Sunday is closed: no slots', async () => {
    const store = await setup();
    store.selectService(cut);
    await store.selectStylist(nikos);
    store.selectDay(sunday);
    expect(store.slots()).toEqual([]);
  });

  it('changing the day clears the chosen slot', async () => {
    const store = await setup();
    store.selectService(cut);
    await store.selectStylist(nikos);
    store.selectDay(tuesday);
    store.selectSlot(store.slots()[0]);
    expect(store.canConfirm()).toBe(true);
    store.selectDay(new Date(2026, 10, 18));
    expect(store.slot()).toBeNull();
    expect(store.canConfirm()).toBe(false);
  });

  it('a successful booking empties the choices', async () => {
    const store = await setup();
    store.selectService(cut);
    await store.selectStylist(nikos);
    store.selectDay(tuesday);
    store.selectSlot(store.slots()[0]); // 11:00
    const result = await store.book('Άννα Δοκιμή', '6900000001');
    expect(result.ok).toBe(true);
    expect(store.service()).toBeNull();
    expect(store.canConfirm()).toBe(false);
  });

  it('when someone else took the slot first: reason "taken" and the slot leaves the list', async () => {
    const store = await setup();
    store.selectService(cut);
    await store.selectStylist(nikos);
    store.selectDay(tuesday);
    const eleven = store.slots()[0];
    store.selectSlot(eleven);
    // Ένας άλλος πελάτης κλείνει την ίδια ώρα, πίσω από την πλάτη του store.
    await TestBed.inject(SalonGateway).book({
      serviceId: cut.id,
      stylistId: nikos.id,
      start: eleven,
      name: 'Βάσω Δοκιμή',
      phone: '6900000002',
    });

    const result = await store.book('Άννα Δοκιμή', '6900000001');
    expect(result).toEqual({ ok: false, reason: 'taken' });
    expect(store.slot()).toBeNull();
    expect(store.slots().map(hhmm)).not.toContain('11:00');
    expect(store.service()).toEqual(cut); // οι υπόλοιπες επιλογές μένουν
  });
});
