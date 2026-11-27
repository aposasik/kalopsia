import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { DemoRequestGateway } from '../../../core/data/demo-requests';
import { RequestGateway } from '../../../core/data/request-gateway';
import { PhotoSource } from '../../../shared/photo/photo-source';
import { RequestPage } from './request.page';
import el from '../../../../assets/i18n/el.json';

/** Ψεύτικη κάμερα: δίνει πάντα την ίδια μικρή «φωτογραφία», ή null σαν να πάτησε ο χρήστης «άκυρο». */
class FakePhotoSource extends PhotoSource {
  next: Blob | null = new Blob(['selfie'], { type: 'image/jpeg' });
  async take(): Promise<Blob | null> {
    return this.next;
  }
  async choose(): Promise<Blob | null> {
    return this.next;
  }
}

/** Η σελίδα χωρίς το canvas: το jsdom δεν έχει, άρα η σμίκρυνση επιστρέφει τη φωτογραφία όπως είναι. */
class TestRequestPage extends RequestPage {
  protected override shrinkPhoto(photo: Blob): Promise<Blob> {
    return Promise.resolve(photo);
  }
}

describe('RequestPage', () => {
  let fixture: ComponentFixture<TestRequestPage>;
  let page: TestRequestPage;
  let gateway: DemoRequestGateway;
  let photos: FakePhotoSource;

  beforeEach(async () => {
    // Το jsdom δεν έχει URL.createObjectURL. Η σελίδα το θέλει μόνο για την προεπισκόπηση.
    URL.createObjectURL = () => 'blob:test';
    URL.revokeObjectURL = () => undefined;
    await TestBed.configureTestingModule({
      imports: [
        TestRequestPage,
        TranslocoTestingModule.forRoot({
          langs: { el },
          translocoConfig: { availableLangs: ['el'], defaultLang: 'el' },
          preloadLangs: true,
        }),
      ],
      providers: [
        provideRouter([]),
        { provide: RequestGateway, useClass: DemoRequestGateway },
        { provide: PhotoSource, useClass: FakePhotoSource },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TestRequestPage);
    fixture.componentRef.setInput('serviceId', 'balayage');
    page = fixture.componentInstance;
    gateway = TestBed.inject(RequestGateway) as DemoRequestGateway;
    photos = TestBed.inject(PhotoSource) as FakePhotoSource;
    fixture.detectChanges();
  });

  function fillText(): void {
    page.wish.set('Θέλω ξανθές ανταύγειες');
    page.name.set('Άννα Δοκιμή');
    page.phone.set('690 000 0001');
  }

  it('cannot send without a photo', () => {
    fillText();
    page.consent.set(true);
    expect(page.canSend()).toBe(false);
  });

  it('cannot send without consent, even with everything else filled in', async () => {
    fillText();
    await page.addPhoto('camera');
    expect(page.canSend()).toBe(false);
    page.consent.set(true);
    expect(page.canSend()).toBe(true);
  });

  it('cancelling the camera leaves the form without a photo', async () => {
    photos.next = null;
    await page.addPhoto('camera');
    expect(page.photo()).toBeNull();
    expect(page.preview()).toBeNull();
  });

  it('send passes the form and the photo to the gateway, then shows the thank-you', async () => {
    fillText();
    page.preferred.set('Πέμπτη πρωί');
    page.channel.set('whatsapp');
    page.consent.set(true);
    await page.addPhoto('gallery');
    await page.send();

    expect(gateway.sent.length).toBe(1);
    expect(gateway.sent[0].request).toEqual({
      serviceId: 'balayage',
      wish: 'Θέλω ξανθές ανταύγειες',
      preferred: 'Πέμπτη πρωί',
      channel: 'whatsapp',
      name: 'Άννα Δοκιμή',
      phone: '690 000 0001',
      consent: true,
    });
    expect(gateway.sent[0].photoBytes).toBe(6); // τα 6 γράμματα του 'selfie'
    expect(page.state()).toBe('sent');
    expect(page.photo()).toBeNull(); // η φωτογραφία δεν μένει στη μνήμη μετά την αποστολή
    await expect
      .poll(() => fixture.nativeElement.querySelector('.done')?.textContent)
      .toContain('Το αίτημα στάλθηκε');
  });

  it('a failed upload keeps the form filled and shows a message', async () => {
    fillText();
    page.consent.set(true);
    await page.addPhoto('camera');
    gateway.send = async () => ({ ok: false, reason: 'upload' });
    await page.send();
    expect(page.problem()).toBe('request.uploadFailed');
    expect(page.state()).toBe('idle');
    expect(page.wish()).toBe('Θέλω ξανθές ανταύγειες');
    expect(page.photo()).not.toBeNull();
  });
});
