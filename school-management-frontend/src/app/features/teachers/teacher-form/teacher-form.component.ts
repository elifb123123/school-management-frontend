import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TeacherService } from '../../../core/services/teacher.service';
import { SchoolService } from '../../../core/services/school.service';
import { SchoolResponse } from '../../../core/models/school.model';
import { SessionService } from '../../../core/services/session.service';
import { extractErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-teacher-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './teacher-form.component.html',
  styleUrl: './teacher-form.component.scss'
})
export class TeacherFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teacherService = inject(TeacherService);
  private readonly schoolService = inject(SchoolService);
  private readonly sessionService = inject(SessionService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isPrincipalScoped = this.sessionService.session()?.role === 'principal';
  private readonly homeRoute = this.isPrincipalScoped ? '/principal/teachers' : '/teachers';

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: Validators.required }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    schoolId: new FormControl<number | null>(null, { validators: Validators.required })
  });

  protected readonly schools = signal<SchoolResponse[]>([]);
  protected readonly isEditMode = signal(false);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);

  private teacherId: number | null = null;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.loading.set(true);

    if (this.isPrincipalScoped) {
      this.form.patchValue({ schoolId: this.sessionService.session()!.entityId });
      if (idParam) {
        this.loadTeacher(Number(idParam));
      } else {
        this.loading.set(false);
      }
      return;
    }

    // TeacherResponse only exposes schoolName, not schoolId, so the schools list must be
    // loaded before an existing teacher's school selection can be resolved and pre-filled.
    this.schoolService.getSchools({ page: 0, size: 100 }).subscribe({
      next: (page) => {
        this.schools.set(page.content);

        if (idParam) {
          this.loadTeacher(Number(idParam));
        } else {
          this.loading.set(false);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
      }
    });
  }

  private loadTeacher(id: number): void {
    this.teacherId = id;
    this.isEditMode.set(true);

    this.teacherService.getTeacher(id).subscribe({
      next: (teacher) => {
        const schoolId = this.isPrincipalScoped
          ? this.sessionService.session()!.entityId
          : (this.schools().find((s) => s.schoolName === teacher.schoolName)?.id ?? null);
        this.form.patchValue({ name: teacher.name, email: teacher.email, schoolId });
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
        this.router.navigate([this.homeRoute]);
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const request = { name: raw.name, email: raw.email, schoolId: raw.schoolId! };
    const result =
      this.isEditMode() && this.teacherId !== null
        ? this.teacherService.updateTeacher(this.teacherId, request)
        : this.teacherService.createTeacher(request);

    result.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open(
          this.isEditMode() ? 'Teacher updated.' : 'Teacher created.',
          'Close',
          { duration: 3000 }
        );
        this.router.navigate([this.homeRoute]);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
      }
    });
  }

  cancel(): void {
    this.router.navigate([this.homeRoute]);
  }
}
