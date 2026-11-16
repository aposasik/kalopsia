import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'owner',
    loadComponent: () => import('./features/owner/dashboard/owner-dashboard.page').then((m) => m.OwnerDashboardPage),
  },
  {
    path: '',
    loadComponent: () => import('./features/client/shell/client-tabs.component').then((m) => m.ClientTabsComponent),
    children: [
      { path: 'home', loadComponent: () => import('./features/client/home/home.page').then((m) => m.HomePage) },
      { path: 'appointments', loadComponent: () => import('./features/client/appointments/appointments.page').then((m) => m.AppointmentsPage) },
      { path: 'my-hair', loadComponent: () => import('./features/client/my-hair/my-hair.page').then((m) => m.MyHairPage) },
      { path: 'perks', loadComponent: () => import('./features/client/perks/perks.page').then((m) => m.PerksPage) },
      { path: 'profile', loadComponent: () => import('./features/client/profile/profile.page').then((m) => m.ProfilePage) },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
];