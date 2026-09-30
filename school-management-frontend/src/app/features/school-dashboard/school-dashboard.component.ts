import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { SchoolService } from '../../core/services/school.service';
import { SessionService } from '../../core/services/session.service';
import { ProfileEditService } from '../../core/services/profile-edit.service';
import { TeacherService } from '../../core/services/teacher.service';
import { StudentService } from '../../core/services/student.service';
import { SchoolResponse } from '../../core/models/school.model';
import { TeacherResponse } from '../../core/models/teacher.model';
import { StudentResponse } from '../../core/models/student.model';
import { extractErrorMessage } from '../../core/utils/api-error';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../shared/confirm-dialog/confirm-dialog.component';
import {
  TeacherFormDialogComponent,
  TeacherFormDialogResult
} from '../../shared/teacher-form-dialog/teacher-form-dialog.component';
import {
  StudentFormDialogComponent,
  StudentFormDialogResult
} from '../../shared/student-form-dialog/student-form-dialog.component';
import { formatBranch } from '../../core/utils/format-branch';

type DashboardTab = 'teachers' | 'students';

@Component({
  selector: 'app-school-dashboard',
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatTableModule,
    MatButtonToggleModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './school-dashboard.component.html',
  styleUrl: './school-dashboard.component.scss'
})
export class SchoolDashboardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly schoolService = inject(SchoolService);
  private readonly sessionService = inject(SessionService);
  private readonly profileEditService = inject(ProfileEditService);
  private readonly teacherService = inject(TeacherService);
  private readonly studentService = inject(StudentService);
  private readonly dialog = inject(MatDialog);
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
  protected readonly addingTeacher = signal(false);
  protected readonly editingTeacherId = signal<number | null>(null);
  protected readonly branches = signal<string[]>([]);
  protected readonly formatBranch = formatBranch;
  protected readonly teacherColumns = ['name', 'branch', 'actions'];
  private teachersLoaded = false;

  protected readonly students = signal<StudentResponse[]>([]);
  protected readonly loadingStudents = signal(false);
  protected readonly addingStudent = signal(false);
  protected readonly editingStudentId = signal<number | null>(null);
  private studentsLoaded = false;

  protected readonly teacherNameFilter = new FormControl('', { nonNullable: true });
  protected readonly teacherEmailFilter = new FormControl('', { nonNullable: true });
  protected readonly teacherBranchFilter = new FormControl('', { nonNullable: true });
  private readonly teacherNameFilterValue = toSignal(this.teacherNameFilter.valueChanges, {
    initialValue: ''
  });
  private readonly teacherEmailFilterValue = toSignal(this.teacherEmailFilter.valueChanges, {
    initialValue: ''
  });
  private readonly teacherBranchFilterValue = toSignal(this.teacherBranchFilter.valueChanges, {
    initialValue: ''
  });

  protected readonly filteredTeachers = computed(() => {
    const name = this.teacherNameFilterValue().trim().toLowerCase();
    const email = this.teacherEmailFilterValue().trim().toLowerCase();
    const branch = this.teacherBranchFilterValue();
    return this.teachers().filter(
      (t) =>
        t.name.toLowerCase().includes(name) &&
        t.email.toLowerCase().includes(email) &&
        (branch === '' || t.branch === branch)
    );
  });

  protected readonly studentNameFilter = new FormControl('', { nonNullable: true });
  protected readonly studentEmailFilter = new FormControl('', { nonNullable: true });
  protected readonly studentIdFilter = new FormControl('', { nonNullable: true });
  private readonly studentNameFilterValue = toSignal(this.studentNameFilter.valueChanges, {
    initialValue: ''
  });
  private readonly studentEmailFilterValue = toSignal(this.studentEmailFilter.valueChanges, {
    initialValue: ''
  });
  private readonly studentIdFilterValue = toSignal(this.studentIdFilter.valueChanges, {
    initialValue: ''
  });

  protected readonly filteredStudents = computed(() => {
    const name = this.studentNameFilterValue().trim().toLowerCase();
    const email = this.studentEmailFilterValue().trim().toLowerCase();
    const id = this.studentIdFilterValue().trim();
    return this.students().filter(
      (s) =>
        s.name.toLowerCase().includes(name) &&
        s.email.toLowerCase().includes(email) &&
        String(s.id).includes(id)
    );
  });

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

    this.teacherService.getBranches().subscribe({
      next: (branches) => this.branches.set(branches),
      error: (err: HttpErrorResponse) =>
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 })
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

  viewTeacher(teacher: TeacherResponse): void {
    this.router.navigate(['/school', this.schoolId, 'teachers', teacher.id]);
  }

  viewStudent(student: StudentResponse): void {
    this.router.navigate(['/school', this.schoolId, 'students', student.id]);
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

  openAddTeacherDialog(): void {
    this.dialog
      .open(TeacherFormDialogComponent, { data: { branches: this.branches() } })
      .afterClosed()
      .subscribe((result: TeacherFormDialogResult | undefined) => {
        if (!result) {
          return;
        }

        this.addingTeacher.set(true);
        this.teacherService
          .registerTeacher({
            userRequest: { name: result.name, email: result.email, password: result.password! },
            teacherRequest: { branch: result.branch, schoolId: this.schoolId }
          })
          .subscribe({
            next: () => {
              this.addingTeacher.set(false);
              this.teacherCount.update((count) => count + 1);
              this.loadTeachers();
              this.snackBar.open('Teacher added.', 'Close', { duration: 3000 });
            },
            error: (err: HttpErrorResponse) => {
              this.addingTeacher.set(false);
              this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
            }
          });
      });
  }

  editTeacher(teacher: TeacherResponse): void {
    this.editingTeacherId.set(teacher.id);
    this.dialog
      .open(TeacherFormDialogComponent, {
        data: {
          initial: { name: teacher.name, email: teacher.email, branch: teacher.branch },
          branches: this.branches()
        }
      })
      .afterClosed()
      .subscribe((result: TeacherFormDialogResult | undefined) => {
        if (!result) {
          this.editingTeacherId.set(null);
          return;
        }

        this.teacherService
          .updateTeacher(teacher.id, {
            userRequest: { name: result.name, email: result.email },
            teacherRequest: { branch: result.branch, schoolId: this.schoolId }
          })
          .subscribe({
            next: (updated) => {
              this.editingTeacherId.set(null);
              this.teachers.update((list) =>
                list.map((t) => (t.id === teacher.id ? updated : t))
              );
              this.snackBar.open('Teacher updated.', 'Close', { duration: 3000 });
            },
            error: (err: HttpErrorResponse) => {
              this.editingTeacherId.set(null);
              this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
            }
          });
      });
  }

  deleteTeacher(teacher: TeacherResponse): void {
    const data: ConfirmDialogData = {
      title: 'Delete teacher',
      message: `Delete "${teacher.name}"? This cannot be undone.`
    };

    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((confirmed: boolean | undefined) => {
        if (!confirmed) {
          return;
        }

        this.teacherService.deleteTeacher(teacher.id).subscribe({
          next: () => {
            this.teachers.update((list) => list.filter((t) => t.id !== teacher.id));
            this.teacherCount.update((count) => Math.max(0, count - 1));
            this.snackBar.open('Teacher deleted.', 'Close', { duration: 3000 });
          },
          error: (err: HttpErrorResponse) => {
            this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
          }
        });
      });
  }

  openAddStudentDialog(): void {
    this.dialog
      .open(StudentFormDialogComponent)
      .afterClosed()
      .subscribe((result: StudentFormDialogResult | undefined) => {
        if (!result) {
          return;
        }

        this.addingStudent.set(true);
        this.studentService
          .registerStudent({
            userRequest: { name: result.name, email: result.email, password: result.password! },
            studentRequest: { dateOfBirth: result.dateOfBirth, schoolId: this.schoolId }
          })
          .subscribe({
            next: () => {
              this.addingStudent.set(false);
              this.studentCount.update((count) => count + 1);
              this.loadStudents();
              this.snackBar.open('Student added.', 'Close', { duration: 3000 });
            },
            error: (err: HttpErrorResponse) => {
              this.addingStudent.set(false);
              this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
            }
          });
      });
  }

  editStudent(student: StudentResponse): void {
    this.editingStudentId.set(student.id);
    this.dialog
      .open(StudentFormDialogComponent, {
        data: {
          initial: {
            name: student.name,
            email: student.email,
            dateOfBirth: student.dateOfBirth
          }
        }
      })
      .afterClosed()
      .subscribe((result: StudentFormDialogResult | undefined) => {
        if (!result) {
          this.editingStudentId.set(null);
          return;
        }

        this.studentService
          .updateStudent(student.id, {
            userRequest: { name: result.name, email: result.email },
            studentRequest: { dateOfBirth: result.dateOfBirth, schoolId: this.schoolId }
          })
          .subscribe({
            next: (updated) => {
              this.editingStudentId.set(null);
              this.students.update((list) =>
                list.map((s) => (s.id === student.id ? updated : s))
              );
              this.snackBar.open('Student updated.', 'Close', { duration: 3000 });
            },
            error: (err: HttpErrorResponse) => {
              this.editingStudentId.set(null);
              this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
            }
          });
      });
  }

  deleteStudent(student: StudentResponse): void {
    const data: ConfirmDialogData = {
      title: 'Delete student',
      message: `Delete "${student.name}"? This cannot be undone.`
    };

    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((confirmed: boolean | undefined) => {
        if (!confirmed) {
          return;
        }

        this.studentService.deleteStudent(student.id).subscribe({
          next: () => {
            this.students.update((list) => list.filter((s) => s.id !== student.id));
            this.studentCount.update((count) => Math.max(0, count - 1));
            this.snackBar.open('Student deleted.', 'Close', { duration: 3000 });
          },
          error: (err: HttpErrorResponse) => {
            this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
          }
        });
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
