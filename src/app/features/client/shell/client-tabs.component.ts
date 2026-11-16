import { Component } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { calendarOutline, cutOutline, giftOutline, homeOutline, personOutline } from 'ionicons/icons';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-client-tabs',
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, TranslocoPipe],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home" href="/home">
          <ion-icon aria-hidden="true" name="home-outline"></ion-icon>
          <ion-label>{{ "tabs.home" | transloco }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="appointments" href="/appointments">
          <ion-icon aria-hidden="true" name="calendar-outline"></ion-icon>
          <ion-label>{{ "tabs.appointments" | transloco }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="my-hair" href="/my-hair">
          <ion-icon aria-hidden="true" name="cut-outline"></ion-icon>
          <ion-label>{{ "tabs.myHair" | transloco }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="perks" href="/perks">
          <ion-icon aria-hidden="true" name="gift-outline"></ion-icon>
          <ion-label>{{ "tabs.perks" | transloco }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="profile" href="/profile">
          <ion-icon aria-hidden="true" name="person-outline"></ion-icon>
          <ion-label>{{ "tabs.profile" | transloco }}</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class ClientTabsComponent {
  constructor() {
    addIcons({ homeOutline, calendarOutline, cutOutline, giftOutline, personOutline });
  }
}