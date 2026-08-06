import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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

  protected readonly navItems = computed<NavItem[]>(() =>
    this.session()?.role === 'principal' ? PRINCIPAL_NAV : []
  );

  switchRole(): void {
    this.sessionService.end();
    this.router.navigate(['/']);
  }
}
