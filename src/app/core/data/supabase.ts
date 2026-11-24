import { InjectionToken, Provider } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { environment } from '../../../environments/environment';

/** Ο ένας πελάτης (client) του Supabase για όλη την εφαρμογή. Τον ζητάς με inject(SUPABASE). */
export const SUPABASE = new InjectionToken<SupabaseClient>('SUPABASE');

export function provideSupabase(): Provider {
  return { provide: SUPABASE, useFactory: () => createClient(environment.supabaseUrl, environment.supabaseKey) };
}