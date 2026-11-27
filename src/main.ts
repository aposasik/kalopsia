import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withComponentInputBinding,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { isDevMode } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from './app/core/i18n/transloco-loader';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

import { DemoSalonGateway } from './app/core/data/demo-salon';
import { SalonGateway } from './app/core/data/salon-gateway';
import { provideSupabase } from './app/core/data/supabase';
import { SupabaseSalonGateway } from './app/core/data/supabase-salon';
import { environment } from './environments/environment';
import { RequestGateway } from './app/core/data/request-gateway';
import { DemoRequestGateway } from './app/core/data/demo-requests';
import { SupabaseRequestGateway } from './app/core/data/supabase-requests';
import { CapacitorPhotoSource, PhotoSource } from './app/shared/photo/photo-source';

// Με URL στο environment μιλάμε με τη βάση. Χωρίς, τρέχει το demo.
const dataProviders = environment.supabaseUrl
  ? [
      provideSupabase(),
      { provide: SalonGateway, useClass: SupabaseSalonGateway },
      { provide: RequestGateway, useClass: SupabaseRequestGateway },
    ]
  : [
      { provide: SalonGateway, useClass: DemoSalonGateway },
      { provide: RequestGateway, useClass: DemoRequestGateway },
    ];

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
    provideHttpClient(),
    ...dataProviders,
    { provide: PhotoSource, useClass: CapacitorPhotoSource },
    provideTransloco({
      config: {
        availableLangs: ['el', 'en'],
        defaultLang: 'el',
        fallbackLang: 'el',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
  ],
});
