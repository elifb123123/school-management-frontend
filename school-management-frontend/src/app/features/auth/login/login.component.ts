import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';
import { Session } from '../../../core/services/session.service';
import { extractErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    password: new FormControl('', { nonNullable: true, validators: Validators.required })
  });

  protected readonly submitting = signal(false);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.authService.login(this.form.getRawValue()).subscribe({
      next: (session) => {
        this.submitting.set(false);
        this.router.navigate([this.homeRouteFor(session)]);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
      }
    });
  }

  private homeRouteFor(session: Session): string {
    switch (session.role) {
      case 'principal':
        return `/school/${session.entityId}`;
      case 'teacher':
        return '/teacher';
      case 'student':
        return '/student';
    }
  }
}
