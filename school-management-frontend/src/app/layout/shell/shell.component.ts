import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';
import { filter, map } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { SessionService } from '../../core/services/session.service';

const NO_CHROME_ROUTES = new Set(['/', '/select-school']);

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly session = this.sessionService.session;

  // Tracks the current URL reactively so chrome visibility can key off the
  // route itself, not just session presence — the picker/select-school
  // routes must never show chrome even if a session is still active (e.g.
  // browser back without ever clearing the session), and unlike a
  // guard-based redirect this doesn't touch browser history at all, so
  // back/forward stay native.
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  protected readonly showChrome = computed(
    () => this.session() !== null && !NO_CHROME_ROUTES.has(this.currentUrl())
  );

  protected readonly profileRoute = computed(() => {
    const session = this.session();
    if (!session) {
      return '/';
    }
    switch (session.role) {
      case 'principal':
        return `/school/${session.entityId}`;
      case 'teacher':
        return '/teacher';
      case 'student':
        return '/student';
    }
  });

  switchRole(): void {
    this.sessionService.end();
    this.router.navigate(['/']);
  }
}
