import { Routes } from '@angular/router';

import { LoginPage } from './features/auth/login.page';
import { ForgotPasswordPage } from './features/auth/forgot-password/forgot-password.page';
import { HomePage } from './features/home/home.page';
import { AdminUsersPage } from './features/admin/admin-users.page';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginPage,
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordPage,
  },
  {
    path: '',
    component: HomePage,
    canActivate: [authGuard],
  },
  {
    path: 'admin/users',
    component: AdminUsersPage,
    canActivate: [authGuard, roleGuard('admin')],
  },
  {
    path: 'animals',
    loadChildren: () => import('./features/animals/animals.routes').then((m) => m.ANIMALS_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: 'species',
    loadChildren: () => import('./features/species/species.routes').then((m) => m.SPECIES_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
