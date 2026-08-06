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
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { SessionService } from '../../core/services/session.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const PRINCIPAL_NAV: NavItem[] = [
  { label: 'School', path: '/principal/school', icon: 'school' },
  { label: 'Teachers', path: '/principal/teachers', icon: 'person' },
  { label: 'Students', path: '/principal/students', icon: 'groups' }
];

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
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
  // route itself, not just session presence — the picker route must never
  // show chrome even if a session is still active (e.g. browser back to '/'
  // without ever clearing the session), and unlike a guard-based redirect
  // this doesn't touch browser history at all, so back/forward stay native.
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  protected readonly showChrome = computed(
    () => this.session() !== null && this.currentUrl() !== '/'
  );

  protected readonly navItems = computed<NavItem[]>(() =>
    this.session()?.role === 'principal' ? PRINCIPAL_NAV : []
  );

  protected readonly profileRoute = computed(() => {
    switch (this.session()?.role) {
      case 'principal':
        return '/principal/school';
      case 'teacher':
        return '/teacher';
      case 'student':
        return '/student';
      default:
        return '/';
    }
  });

  switchRole(): void {
    this.sessionService.end();
    this.router.navigate(['/']);
  }
}
