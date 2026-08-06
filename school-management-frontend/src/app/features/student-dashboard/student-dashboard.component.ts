import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { StudentService } from '../../core/services/student.service';
import { SchoolService } from '../../core/services/school.service';
import { SessionService } from '../../core/services/session.service';
import { StudentResponse } from '../../core/models/student.model';
import { TeacherResponse } from '../../core/models/teacher.model';
import { extractErrorMessage } from '../../core/utils/api-error';
import {
  PeoplePickerDialogComponent,
  PersonOption
} from '../../shared/people-picker-dialog/people-picker-dialog.component';

@Component({
  selector: 'app-student-dashboard',
  imports: [
    RouterLink,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.scss'
})
export class StudentDashboardComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly schoolService = inject(SchoolService);
  private readonly sessionService = inject(SessionService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private readonly studentId = this.sessionService.session()!.entityId;

  protected readonly profile = signal<StudentResponse | null>(null);
  protected readonly linkedTeachers = signal<TeacherResponse[]>([]);
  protected readonly schoolTeachers = signal<TeacherResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly linking = signal(false);

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

  openAddTeacherDialog(): void {
    const dialogRef = this.dialog.open(PeoplePickerDialogComponent, {
      data: {
        title: 'Add a teacher from your school',
        searchPlaceholder: 'Search teachers by name or email',
        emptyMessage: 'No teachers available at your school to link.',
        people: this.availableTeachers().map(
          (t): PersonOption => ({ id: t.id, name: t.name, email: t.email })
        )
      }
    });

    dialogRef.afterClosed().subscribe((selected: PersonOption | undefined) => {
      if (!selected) {
        return;
      }
      this.linkTeacher(selected.id);
    });
  }

  private linkTeacher(teacherId: number): void {
    this.linking.set(true);
    this.studentService.linkTeacher(this.studentId, teacherId).subscribe({
      next: () => {
        this.linking.set(false);
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
