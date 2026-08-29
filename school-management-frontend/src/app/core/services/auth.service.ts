import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap, tap } from 'rxjs';

import { API_BASE_URL } from '../api-config';
import {
  LoginRequest,
  MeResponse,
  PrincipalRegistrationRequest,
  TokenResponse
} from '../models/auth.model';
import { UserResponse } from '../models/user.model';
import { Role, Session, SessionService } from './session.service';

const ACCESS_TOKEN_KEY = 'sm.accessToken';
const REFRESH_TOKEN_KEY = 'sm.refreshToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sessionService = inject(SessionService);
  private readonly baseUrl = `${API_BASE_URL}/api`;

  get accessToken(): string | null {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }

  login(request: LoginRequest): Observable<Session> {
    return this.http.post<TokenResponse>(`${this.baseUrl}/auth/login`, request).pipe(
      tap((tokens) => this.storeTokens(tokens)),
      switchMap(() => this.loadSession())
    );
  }

  registerPrincipal(request: PrincipalRegistrationRequest): Observable<Session> {
    return this.http
      .post<UserResponse>(`${this.baseUrl}/register/principal`, request)
      .pipe(switchMap(() => this.login({ ...request.userRequest })));
  }

  logout(): void {
    const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      this.http.post(`${this.baseUrl}/auth/logout`, { refreshToken }).subscribe({ error: () => {} });
    }
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    this.sessionService.end();
  }

  private loadSession(): Observable<Session> {
    return this.http.get<MeResponse>(`${this.baseUrl}/me`).pipe(
      map((me) => {
        const role = me.role.toLowerCase() as Role;
        const session: Session = {
          role,
          entityId: me.entityId ?? 0,
          label: me.name
        };
        this.sessionService.start(session);
        return session;
      })
    );
  }

  private storeTokens(tokens: TokenResponse): void {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }
}
