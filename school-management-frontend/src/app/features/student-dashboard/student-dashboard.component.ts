import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

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
import { formatBranch } from '../../core/utils/format-branch';

@Component({
  selector: 'app-student-dashboard',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.scss'
})
export class StudentDashboardComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly schoolService = inject(SchoolService);
  private readonly sessionService = inject(SessionService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly studentId = this.sessionService.session()!.entityId;
  protected readonly formatBranch = formatBranch;

  protected readonly profile = signal<StudentResponse | null>(null);
  protected readonly schoolName = signal('');
  protected readonly linkedTeachers = signal<TeacherResponse[]>([]);
  protected readonly loading = signal(false);

  ngOnInit(): void {
    this.loading.set(true);

    this.studentService.getStudent(this.studentId).subscribe({
      next: (student) => {
        this.profile.set(student);
        this.loadSchool(student.schoolId);
      },
      error: (err: HttpErrorResponse) =>
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 })
    });

    this.loadLinkedTeachers();
  }

  private loadSchool(schoolId: number): void {
    this.schoolService.getSchool(schoolId).subscribe({
      next: (school) => this.schoolName.set(school.schoolName),
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
}
