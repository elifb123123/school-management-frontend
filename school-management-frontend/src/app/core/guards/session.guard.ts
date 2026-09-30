import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Role, SessionService } from '../services/session.service';

export const sessionGuard: CanActivateFn = (route) => {
  const session = inject(SessionService).session();
  const router = inject(Router);
  const requiredRole = route.data['role'] as Role;

  if (!session || session.role !== requiredRole) {
    return router.createUrlTree(['/']);
  }

  return true;
};
