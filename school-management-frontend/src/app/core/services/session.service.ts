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
