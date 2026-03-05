import { Routes } from '@angular/router';

import { LoginPage } from './features/auth/login.page';
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
    path: '',
    component: HomePage,
    canActivate: [authGuard],
  },
  {
    path: 'admin/users',
    component: AdminUsersPage,
    canActivate: [roleGuard('superAdmin')],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
