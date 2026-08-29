import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionService } from '../services/session.service';

/**
 * Guards /school/:schoolId: only the principal currently signed in as that
 * exact school may view its dashboard — the URL and the active session must
 * agree, so switching the URL to a different school id without being signed
 * in as its principal bounces back to /login instead of leaking the page.
 */
export const schoolDashboardGuard: CanActivateFn = (route) => {
  const session = inject(SessionService).session();
  const router = inject(Router);
  const schoolId = Number(route.paramMap.get('schoolId'));

  if (!session || session.role !== 'principal' || session.entityId !== schoolId) {
    return router.createUrlTree(['/login']);
  }

  return true;
};
