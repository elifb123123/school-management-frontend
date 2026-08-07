import { Injectable, signal } from '@angular/core';

import { Role } from './session.service';

/**
 * Lets the shell's top-right Settings menu (outside the routed page) ask the
 * currently-mounted profile page to switch into edit mode in place, without
 * a route change. The requesting role is the payload so a page only reacts
 * to a request meant for it; the target clears the request once handled so
 * it can't re-trigger on a later mount.
 */
@Injectable({ providedIn: 'root' })
export class ProfileEditService {
  private readonly _editRequested = signal<Role | null>(null);
  readonly editRequested = this._editRequested.asReadonly();

  requestEdit(role: Role): void {
    this._editRequested.set(role);
  }

  clear(): void {
    this._editRequested.set(null);
  }
}
