import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { DemoSalonGateway } from '../../../core/data/demo-salon';
import { SalonGateway } from '../../../core/data/salon-gateway';
import { BookingPage } from './booking.page';
import { nextDays } from './booking.store';
import el from '../../../../assets/i18n/el.json';

describe('BookingPage', () => {
  let fixture: ComponentFixture<BookingPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BookingPage,
        TranslocoTestingModule.forRoot({
          langs: { el },
          translocoConfig: { availableLangs: ['el'], defaultLang: 'el' },
          preloadLangs: true,
        }),
      ],
      providers: [{ provide: SalonGateway, useClass: DemoSalonGateway }],
    }).compileComponents();
    fixture = TestBed.createComponent(BookingPage);
    fixture.detectChanges();
    // Ο τιμοκατάλογος έρχεται πια από το gateway, μία στροφή αργότερα.
    await expect.poll(() => items().length).toBe(3);
  });

  const items = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('ion-content ion-item'));

  it('lists the three services with their prices', () => {
    expect(items().length).toBe(3);
    expect(items()[0].textContent).toContain('Κούρεμα');
    expect(items()[0].textContent).toContain('20,00 €');
  });

  it('shows no summary bar before a service is chosen', () => {
    expect(fixture.nativeElement.querySelector('.summary-bar')).toBeNull();
  });

  it('tapping a service selects it, shows the deposit and opens the stylist sheet', async () => {
    items()[1].click(); // Βαφή, €45
    fixture.detectChanges();
    const page = fixture.componentInstance;
    expect(page.store.service()?.id).toBe('color');
    expect(page.sheet()).toBe('stylist');
    await expect
      .poll(() => fixture.nativeElement.querySelector('.summary-bar')?.textContent)
      .toContain('13,50 €');
  });

  it('the confirm button needs a name and a 10-digit phone', () => {
    const page = fixture.componentInstance;
    expect(page.canBook()).toBe(false);
    page.name.set('Άννα');
    page.phone.set('690 000');
    expect(page.canBook()).toBe(false);
    page.phone.set('690 000 0001');
    expect(page.canBook()).toBe(true);
  });

  it('a taken slot sends the customer back to the times with a message', async () => {
    const page = fixture.componentInstance;
    const [cut] = page.store.services();
    const [, nikos] = page.store.stylists();
    page.store.selectService(cut);
    await page.store.selectStylist(nikos);
    const day = page.store.days().find((d) => page.hasSlots(d)) as Date;
    page.store.selectDay(day);
    const slot = page.store.slots()[0];
    page.store.selectSlot(slot);
    await TestBed.inject(SalonGateway).book({
      serviceId: cut.id,
      stylistId: nikos.id,
      start: slot,
      name: 'Βάσω Δοκιμή',
      phone: '6900000002',
    });

    page.name.set('Άννα Δοκιμή');
    page.phone.set('6900000001');
    await page.confirm();
    expect(page.problem()).toBe('booking.taken');
    expect(page.sheet()).toBe('time');
    expect(page.done()).toBe(false);
  });

  it('euro() writes cents as euros with a comma', () => {
    expect(fixture.componentInstance.euro(1350)).toBe('13,50 €');
    expect(fixture.componentInstance.euro(9000)).toBe('90,00 €');
  });

  it('nextDays gives consecutive days and crosses the end of the month', () => {
    const days = nextDays(new Date(2026, 10, 29, 15, 30), 3); // 29 Νοεμβρίου, 15:30
    expect(days.map((d) => `${d.getDate()}/${d.getMonth() + 1}`)).toEqual([
      '29/11',
      '30/11',
      '1/12',
    ]);
    expect(days[0].getHours()).toBe(0);
  });
});
