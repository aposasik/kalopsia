import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { ClientTabsComponent } from './client-tabs.component';
import el from '../../../../assets/i18n/el.json';
import en from '../../../../assets/i18n/en.json';

describe('ClientTabsComponent', () => {
  let fixture: ComponentFixture<ClientTabsComponent>;

  async function setup(lang: 'el' | 'en') {
    await TestBed.configureTestingModule({
      imports: [
        ClientTabsComponent,
        TranslocoTestingModule.forRoot({
          langs: { el, en },
          translocoConfig: { availableLangs: ['el', 'en'], defaultLang: lang },
          preloadLangs: true,
        }),
      ],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(ClientTabsComponent);
    fixture.detectChanges();
  }

  const labels = () =>
    Array.from<Element>(fixture.nativeElement.querySelectorAll('ion-label')).map((l) => l.textContent?.trim());

  it('shows five tabs', async () => {
    await setup('el');
    const buttons = fixture.nativeElement.querySelectorAll('ion-tab-button');
    expect(buttons.length).toBe(5);
  });

  it('the tabs are home, appointments, my-hair, perks, profile, in this order', async () => {
    await setup('el');
    const buttons: Element[] = Array.from(fixture.nativeElement.querySelectorAll('ion-tab-button'));
    expect(buttons.map((b) => b.getAttribute('tab'))).toEqual(['home', 'appointments', 'my-hair', 'perks', 'profile']);
  });

  it('the labels are in Greek when the language is el', async () => {
    await setup('el');
    await expect.poll(labels).toEqual(['Αρχική', 'Ραντεβού', 'Τα μαλλιά μου', 'Προνόμια', 'Προφίλ']);
  });

  it('the labels are in English when the language is en', async () => {
    await setup('en');
    await expect.poll(labels).toEqual(['Home', 'Appointments', 'My Hair', 'Perks', 'Profile']);
  });
});