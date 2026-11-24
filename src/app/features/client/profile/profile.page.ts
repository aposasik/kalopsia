import { Component } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { TranslocoPipe } from '@jsverse/transloco';
@Component({
  selector: 'app-profile',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, TranslocoPipe],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ "tabs.profile" | transloco }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding"></ion-content>
  `,
})
export class ProfilePage {}