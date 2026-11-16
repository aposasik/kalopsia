import { Component } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
  selector: 'app-appointments',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Ραντεβού</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding"></ion-content>
  `,
})
export class AppointmentsPage {}