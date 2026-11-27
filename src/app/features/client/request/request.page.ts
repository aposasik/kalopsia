import { Component, computed, inject, input, OnDestroy, signal } from '@angular/core';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { TranslocoPipe } from '@jsverse/transloco';

import { Channel, RequestGateway } from '../../../core/data/request-gateway';
import { PhotoSource } from '../../../shared/photo/photo-source';
import { shrink } from '../../../shared/photo/fit';

@Component({
  selector: 'app-request',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonList,
    IonItem,
    IonTextarea,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonCheckbox,
    IonButton,
    TranslocoPipe,
  ],
  templateUrl: './request.page.html',
  styleUrl: './request.page.scss',
})
export class RequestPage implements OnDestroy {
  private readonly gateway = inject(RequestGateway);
  private readonly photos = inject(PhotoSource);

  /** Το id της υπηρεσίας, από τη διεύθυνση /request/:serviceId. */
  readonly serviceId = input.required<string>();

  readonly wish = signal('');
  readonly preferred = signal('');
  readonly channel = signal<Channel>('viber');
  readonly name = signal('');
  readonly phone = signal('');
  readonly consent = signal(false);
  readonly photo = signal<Blob | null>(null);
  /** Διεύθυνση για την προεπισκόπηση. Ζει μόνο στη μνήμη του browser. */
  readonly preview = signal<string | null>(null);
  readonly state = signal<'idle' | 'sending' | 'sent'>('idle');
  readonly problem = signal<string | null>(null);

  /** Όλα τα υποχρεωτικά: τι θέλει, φωτογραφία, όνομα, κινητό και συγκατάθεση. */
  readonly canSend = computed(
    () =>
      this.wish().trim().length >= 5 &&
      !!this.photo() &&
      this.name().trim().length >= 2 &&
      this.phone().replace(/\D/g, '').length >= 10 &&
      this.consent() &&
      this.state() === 'idle',
  );

  async addPhoto(from: 'camera' | 'gallery'): Promise<void> {
    const picked = from === 'camera' ? await this.photos.take() : await this.photos.choose();
    if (!picked) {
      return; // ο χρήστης το ακύρωσε
    }
    this.setPhoto(await this.shrinkPhoto(picked));
  }

  removePhoto(): void {
    this.setPhoto(null);
  }

  async send(): Promise<void> {
    const photo = this.photo();
    if (!this.canSend() || !photo) {
      return;
    }
    this.state.set('sending');
    this.problem.set(null);
    const result = await this.gateway.send(
      {
        serviceId: this.serviceId(),
        wish: this.wish().trim(),
        preferred: this.preferred().trim(),
        channel: this.channel(),
        name: this.name().trim(),
        phone: this.phone().trim(),
        consent: this.consent(),
      },
      photo,
    );
    if (result.ok) {
      this.setPhoto(null);
      this.state.set('sent');
    } else {
      this.problem.set(result.reason === 'upload' ? 'request.uploadFailed' : 'request.failed');
      this.state.set('idle');
    }
  }

  ngOnDestroy(): void {
    this.setPhoto(null);
  }

  /** Ξεχωριστή μέθοδος για να την αντικαθιστά το τεστ: το jsdom δεν έχει canvas. */
  protected shrinkPhoto(photo: Blob): Promise<Blob> {
    return shrink(photo);
  }

  private setPhoto(photo: Blob | null): void {
    const old = this.preview();
    if (old) {
      URL.revokeObjectURL(old); // ελευθερώνει τη μνήμη της παλιάς προεπισκόπησης
    }
    this.photo.set(photo);
    this.preview.set(photo ? URL.createObjectURL(photo) : null);
  }
}
