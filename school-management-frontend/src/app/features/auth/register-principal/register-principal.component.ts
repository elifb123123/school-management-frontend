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
import { extractErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-register-principal',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './register-principal.component.html',
  styleUrl: './register-principal.component.scss'
})
export class RegisterPrincipalComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(20)]
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)]
    }),
    schoolName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    address: new FormControl('', { nonNullable: true, validators: Validators.required })
  });

  protected readonly submitting = signal(false);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const raw = this.form.getRawValue();
    this.authService
      .registerPrincipal({
        userRequest: { name: raw.name, email: raw.email, password: raw.password },
        schoolRequest: { schoolName: raw.schoolName, address: raw.address }
      })
      .subscribe({
        next: (session) => {
          this.submitting.set(false);
          this.router.navigate([`/school/${session.entityId}`]);
        },
        error: (err: HttpErrorResponse) => {
          this.submitting.set(false);
          this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
        }
      });
  }
}
