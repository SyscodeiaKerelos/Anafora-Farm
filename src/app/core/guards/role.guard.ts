import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

import { Role } from '../types/role';
import { AuthService } from '../services/auth.service';

export const roleGuard = (required: Role): CanActivateFn => {
  return async (): Promise<boolean | UrlTree> => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = await authService.waitForCurrentUser();

    if (!user) {
      return router.parseUrl('/login');
    }

    if (authService.hasAtLeastRole(required)) {
      return true;
    }

    return router.parseUrl('/');
  };
};

