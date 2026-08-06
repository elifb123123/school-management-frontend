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

import { TeacherService } from '../../core/services/teacher.service';
import { StudentService } from '../../core/services/student.service';
import { SessionService } from '../../core/services/session.service';
import { TeacherResponse } from '../../core/models/teacher.model';
import { StudentResponse } from '../../core/models/student.model';
import { extractErrorMessage } from '../../core/utils/api-error';
import {
  PeoplePickerDialogComponent,
  PersonOption
} from '../../shared/people-picker-dialog/people-picker-dialog.component';

@Component({
  selector: 'app-teacher-dashboard',
  imports: [
    RouterLink,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './teacher-dashboard.component.html',
  styleUrl: './teacher-dashboard.component.scss'
})
export class TeacherDashboardComponent implements OnInit {
  private readonly teacherService = inject(TeacherService);
  private readonly studentService = inject(StudentService);
  private readonly sessionService = inject(SessionService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private readonly teacherId = this.sessionService.session()!.entityId;

  protected readonly profile = signal<TeacherResponse | null>(null);
  protected readonly linkedStudents = signal<StudentResponse[]>([]);
  protected readonly allStudents = signal<StudentResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly linking = signal(false);

  protected readonly availableStudents = computed(() => {
    const linkedIds = new Set(this.linkedStudents().map((s) => s.id));
    return this.allStudents().filter((s) => !linkedIds.has(s.id));
  });

  ngOnInit(): void {
    this.loading.set(true);

    this.teacherService.getTeacher(this.teacherId).subscribe({
      next: (teacher) => this.profile.set(teacher),
      error: (err: HttpErrorResponse) =>
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 })
    });

    this.studentService.getStudents({ page: 0, size: 100 }).subscribe({
      next: (page) => this.allStudents.set(page.content),
      error: (err: HttpErrorResponse) =>
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 })
    });

    this.loadLinkedStudents();
  }

  private loadLinkedStudents(): void {
    this.loading.set(true);
    this.teacherService.getStudentsOfTeacher(this.teacherId).subscribe({
      next: (students) => {
        this.linkedStudents.set(students);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
      }
    });
  }

  openAddStudentDialog(): void {
    const dialogRef = this.dialog.open(PeoplePickerDialogComponent, {
      data: {
        title: 'Add a student',
        searchPlaceholder: 'Search students by name or email',
        emptyMessage: 'No students available to link.',
        people: this.availableStudents().map(
          (s): PersonOption => ({ id: s.id, name: s.name, email: s.email })
        )
      }
    });

    dialogRef.afterClosed().subscribe((selected: PersonOption | undefined) => {
      if (!selected) {
        return;
      }
      this.linkStudent(selected.id);
    });
  }

  private linkStudent(studentId: number): void {
    this.linking.set(true);
    this.teacherService.linkStudent(this.teacherId, studentId).subscribe({
      next: () => {
        this.linking.set(false);
        this.snackBar.open('Student linked.', 'Close', { duration: 3000 });
        this.loadLinkedStudents();
      },
      error: (err: HttpErrorResponse) => {
        this.linking.set(false);
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
      }
    });
  }

  unlinkStudent(student: StudentResponse): void {
    this.teacherService.unlinkStudent(this.teacherId, student.id).subscribe({
      next: () => {
        this.snackBar.open('Student unlinked.', 'Close', { duration: 3000 });
        this.loadLinkedStudents();
      },
      error: (err: HttpErrorResponse) => {
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
      }
    });
  }
}
