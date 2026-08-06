import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { StudentService } from '../../core/services/student.service';
import { SchoolService } from '../../core/services/school.service';
import { SessionService } from '../../core/services/session.service';
import { StudentResponse } from '../../core/models/student.model';
import { TeacherResponse } from '../../core/models/teacher.model';
import { extractErrorMessage } from '../../core/utils/api-error';

@Component({
  selector: 'app-student-dashboard',
  imports: [
    ReactiveFormsModule,
    MatListModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.scss'
})
export class StudentDashboardComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly schoolService = inject(SchoolService);
  private readonly sessionService = inject(SessionService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly studentId = this.sessionService.session()!.entityId;

  protected readonly profile = signal<StudentResponse | null>(null);
  protected readonly linkedTeachers = signal<TeacherResponse[]>([]);
  protected readonly schoolTeachers = signal<TeacherResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly linking = signal(false);
  protected readonly selectedTeacherId = new FormControl<number | null>(null);

  protected readonly availableTeachers = computed(() => {
    const linkedIds = new Set(this.linkedTeachers().map((t) => t.id));
    return this.schoolTeachers().filter((t) => !linkedIds.has(t.id));
  });

  ngOnInit(): void {
    this.loading.set(true);

    this.studentService.getStudent(this.studentId).subscribe({
      next: (student) => {
        this.profile.set(student);
        this.loadSchoolTeachers(student.schoolName);
      },
      error: (err: HttpErrorResponse) =>
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 })
    });

    this.loadLinkedTeachers();
  }

  private loadSchoolTeachers(schoolName: string): void {
    this.schoolService.getSchools({ page: 0, size: 100 }).subscribe({
      next: (page) => {
        const school = page.content.find((s) => s.schoolName === schoolName);
        if (!school) {
          return;
        }
        this.schoolService.getTeachersBySchool(school.id, { page: 0, size: 100 }).subscribe({
          next: (teacherPage) => this.schoolTeachers.set(teacherPage.content),
          error: (err: HttpErrorResponse) =>
            this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 })
        });
      },
      error: (err: HttpErrorResponse) =>
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 })
    });
  }

  private loadLinkedTeachers(): void {
    this.loading.set(true);
    this.studentService.getTeachersOfStudent(this.studentId).subscribe({
      next: (teachers) => {
        this.linkedTeachers.set(teachers);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
      }
    });
  }

  linkSelectedTeacher(): void {
    const teacherId = this.selectedTeacherId.value;
    if (teacherId === null) {
      return;
    }

    this.linking.set(true);
    this.studentService.linkTeacher(this.studentId, teacherId).subscribe({
      next: () => {
        this.linking.set(false);
        this.selectedTeacherId.reset();
        this.snackBar.open('Teacher linked.', 'Close', { duration: 3000 });
        this.loadLinkedTeachers();
      },
      error: (err: HttpErrorResponse) => {
        this.linking.set(false);
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
      }
    });
  }

  unlinkTeacher(teacher: TeacherResponse): void {
    this.studentService.unlinkTeacher(this.studentId, teacher.id).subscribe({
      next: () => {
        this.snackBar.open('Teacher unlinked.', 'Close', { duration: 3000 });
        this.loadLinkedTeachers();
      },
      error: (err: HttpErrorResponse) => {
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
      }
    });
  }
}
