import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SchoolService } from '../../core/services/school.service';
import { SessionService } from '../../core/services/session.service';
import { ProfileEditService } from '../../core/services/profile-edit.service';
import { SchoolResponse } from '../../core/models/school.model';
import { TeacherResponse } from '../../core/models/teacher.model';
import { StudentResponse } from '../../core/models/student.model';
import { extractErrorMessage } from '../../core/utils/api-error';

type DashboardTab = 'teachers' | 'students';

@Component({
  selector: 'app-school-dashboard',
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatListModule,
    MatButtonToggleModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './school-dashboard.component.html',
  styleUrl: './school-dashboard.component.scss'
})
export class SchoolDashboardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly schoolService = inject(SchoolService);
  private readonly sessionService = inject(SessionService);
  private readonly profileEditService = inject(ProfileEditService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly schoolId = Number(this.route.snapshot.paramMap.get('schoolId'));

  protected readonly school = signal<SchoolResponse | null>(null);
  protected readonly teacherCount = signal(0);
  protected readonly studentCount = signal(0);
  protected readonly loadingProfile = signal(true);
  protected readonly profileError = signal<string | null>(null);

  protected readonly isEditingProfile = signal(false);
  protected readonly saving = signal(false);
  protected readonly editForm = new FormGroup({
    schoolName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    address: new FormControl('', { nonNullable: true, validators: Validators.required })
  });

  protected readonly activeTab = signal<DashboardTab>('teachers');

  protected readonly teachers = signal<TeacherResponse[]>([]);
  protected readonly loadingTeachers = signal(false);
  private teachersLoaded = false;

  protected readonly students = signal<StudentResponse[]>([]);
  protected readonly loadingStudents = signal(false);
  private studentsLoaded = false;

  // Reacts to the shell's top-right "Edit Profile" menu — a different
  // component reached via the toolbar, not a route change — asking this
  // page to switch its hero card into edit mode in place.
  private readonly watchEditRequests = effect(() => {
    if (this.profileEditService.editRequested() === 'principal') {
      this.startEditingProfile();
      this.profileEditService.clear();
    }
  });

  ngOnInit(): void {
    this.schoolService.getSchool(this.schoolId).subscribe({
      next: (school) => {
        this.school.set(school);
        this.loadingProfile.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingProfile.set(false);
        this.profileError.set(extractErrorMessage(err));
      }
    });

    this.schoolService.getTeachersBySchool(this.schoolId, { page: 0, size: 1 }).subscribe({
      next: (page) => this.teacherCount.set(page.totalElements)
    });

    this.schoolService.getStudentsBySchool(this.schoolId, { page: 0, size: 1 }).subscribe({
      next: (page) => this.studentCount.set(page.totalElements)
    });

    this.loadTeachers();
  }

  onTabChange(event: MatButtonToggleChange): void {
    const tab = event.value as DashboardTab;
    this.activeTab.set(tab);

    if (tab === 'teachers' && !this.teachersLoaded) {
      this.loadTeachers();
    } else if (tab === 'students' && !this.studentsLoaded) {
      this.loadStudents();
    }
  }

  private startEditingProfile(): void {
    const current = this.school();
    if (!current) {
      return;
    }
    this.editForm.setValue({ schoolName: current.schoolName, address: current.address });
    this.isEditingProfile.set(true);
  }

  cancelEditingProfile(): void {
    this.isEditingProfile.set(false);
  }

  saveProfile(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const request = this.editForm.getRawValue();

    this.schoolService.updateSchool(this.schoolId, request).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.school.set(updated);
        this.sessionService.updateLabel(updated.schoolName);
        this.snackBar.open('School updated.', 'Close', { duration: 3000 });
        this.isEditingProfile.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
      }
    });
  }

  private loadTeachers(): void {
    this.loadingTeachers.set(true);
    this.schoolService.getTeachersBySchool(this.schoolId, { page: 0, size: 100 }).subscribe({
      next: (page) => {
        this.teachers.set(page.content);
        this.teachersLoaded = true;
        this.loadingTeachers.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingTeachers.set(false);
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
      }
    });
  }

  private loadStudents(): void {
    this.loadingStudents.set(true);
    this.schoolService.getStudentsBySchool(this.schoolId, { page: 0, size: 100 }).subscribe({
      next: (page) => {
        this.students.set(page.content);
        this.studentsLoaded = true;
        this.loadingStudents.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingStudents.set(false);
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
      }
    });
  }
}
