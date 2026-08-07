import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SchoolService } from '../../../core/services/school.service';
import { SessionService } from '../../../core/services/session.service';
import { extractErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-principal-school-edit',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './principal-school-edit.component.html',
  styleUrl: './principal-school-edit.component.scss'
})
export class PrincipalSchoolEditComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly schoolService = inject(SchoolService);
  private readonly sessionService = inject(SessionService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly schoolId = this.sessionService.session()!.entityId;

  protected readonly form = new FormGroup({
    schoolName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    address: new FormControl('', { nonNullable: true, validators: Validators.required })
  });

  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saving = signal(false);

  ngOnInit(): void {
    this.schoolService.getSchool(this.schoolId).subscribe({
      next: (school) => {
        this.form.setValue({ schoolName: school.schoolName, address: school.address });
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.loadError.set(extractErrorMessage(err));
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const request = this.form.getRawValue();

    this.schoolService.updateSchool(this.schoolId, request).subscribe({
      next: () => {
        this.saving.set(false);
        this.sessionService.updateLabel(request.schoolName);
        this.snackBar.open('School updated.', 'Close', { duration: 3000 });
        this.router.navigate(['/principal/school']);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/principal/school']);
  }
}
