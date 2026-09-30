import { Injectable, signal } from '@angular/core';

export type Role = 'principal' | 'teacher' | 'student';

export interface Session {
  role: Role;
  entityId: number;
  label: string;
}

const STORAGE_KEY = 'sm.session';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly _session = signal<Session | null>(this.restore());
  readonly session = this._session.asReadonly();

  start(session: Session): void {
    this._session.set(session);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  end(): void {
    this._session.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Updates the cached display label (e.g. after the current user renames
   * themselves or their school) without disturbing role/entityId.
   */
  updateLabel(label: string): void {
    const current = this._session();
    if (!current) {
      return;
    }
    const updated: Session = { ...current, label };
    this._session.set(updated);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  private restore(): Session | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as Session;
    } catch {
      return null;
    }
  }
}
