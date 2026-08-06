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

import { StudentService } from '../../../core/services/student.service';
import { SchoolService } from '../../../core/services/school.service';
import { SchoolResponse } from '../../../core/models/school.model';
import { SessionService } from '../../../core/services/session.service';
import { extractErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-student-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './student-form.component.html',
  styleUrl: './student-form.component.scss'
})
export class StudentFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly studentService = inject(StudentService);
  private readonly schoolService = inject(SchoolService);
  private readonly sessionService = inject(SessionService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isPrincipalScoped = this.sessionService.session()?.role === 'principal';
  protected readonly isSelfScoped = this.sessionService.session()?.role === 'student';
  protected readonly hideSchoolField = this.isPrincipalScoped || this.isSelfScoped;
  private readonly homeRoute = this.isPrincipalScoped
    ? '/principal/students'
    : this.isSelfScoped
      ? '/student'
      : '/students';

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(20)]
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    dateOfBirth: new FormControl('', { nonNullable: true, validators: Validators.required }),
    schoolId: new FormControl<number | null>(null, { validators: Validators.required })
  });

  protected readonly schools = signal<SchoolResponse[]>([]);
  protected readonly isEditMode = signal(false);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);

  private studentId: number | null = null;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.loading.set(true);

    if (this.isPrincipalScoped) {
      this.form.patchValue({ schoolId: this.sessionService.session()!.entityId });
      if (idParam) {
        this.loadStudent(Number(idParam));
      } else {
        this.loading.set(false);
      }
      return;
    }

    if (this.isSelfScoped) {
      // A student always edits themselves — never creates, never picks an id. Unlike the
      // principal scope, a student's identity isn't the school, so the current schoolId
      // still needs resolving via the schools list (same as the legacy path below).
      this.schoolService.getSchools({ page: 0, size: 100 }).subscribe({
        next: (page) => {
          this.schools.set(page.content);
          this.loadStudent(this.sessionService.session()!.entityId);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
        }
      });
      return;
    }

    // StudentResponse only exposes schoolName, not schoolId, so the schools list must be
    // loaded before an existing student's school selection can be resolved and pre-filled.
    this.schoolService.getSchools({ page: 0, size: 100 }).subscribe({
      next: (page) => {
        this.schools.set(page.content);

        if (idParam) {
          this.loadStudent(Number(idParam));
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

  private loadStudent(id: number): void {
    this.studentId = id;
    this.isEditMode.set(true);

    this.studentService.getStudent(id).subscribe({
      next: (student) => {
        const schoolId = this.isPrincipalScoped
          ? this.sessionService.session()!.entityId
          : (this.schools().find((s) => s.schoolName === student.schoolName)?.id ?? null);
        this.form.patchValue({
          name: student.name,
          email: student.email,
          dateOfBirth: student.dateOfBirth,
          schoolId
        });
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
    const request = {
      name: raw.name,
      email: raw.email,
      dateOfBirth: raw.dateOfBirth,
      schoolId: raw.schoolId!
    };
    const result =
      this.isEditMode() && this.studentId !== null
        ? this.studentService.updateStudent(this.studentId, request)
        : this.studentService.createStudent(request);

    result.subscribe({
      next: () => {
        this.saving.set(false);
        if (this.isSelfScoped) {
          this.sessionService.updateLabel(raw.name);
        }
        this.snackBar.open(
          this.isEditMode() ? 'Student updated.' : 'Student created.',
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
