import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TeacherService } from '../../core/services/teacher.service';
import { SchoolService } from '../../core/services/school.service';
import { SessionService } from '../../core/services/session.service';
import { TeacherResponse } from '../../core/models/teacher.model';
import { StudentResponse } from '../../core/models/student.model';
import { extractErrorMessage } from '../../core/utils/api-error';

@Component({
  selector: 'app-teacher-dashboard',
  imports: [RouterLink, MatListModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './teacher-dashboard.component.html',
  styleUrl: './teacher-dashboard.component.scss'
})
export class TeacherDashboardComponent implements OnInit {
  private readonly teacherService = inject(TeacherService);
  private readonly schoolService = inject(SchoolService);
  private readonly sessionService = inject(SessionService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly teacherId = this.sessionService.session()!.entityId;

  protected readonly profile = signal<TeacherResponse | null>(null);
  protected readonly schoolName = signal('');
  protected readonly linkedStudents = signal<StudentResponse[]>([]);
  protected readonly loading = signal(false);

  ngOnInit(): void {
    this.loading.set(true);

    this.teacherService.getTeacher(this.teacherId).subscribe({
      next: (teacher) => {
        this.profile.set(teacher);
        this.loadSchool(teacher.schoolId);
      },
      error: (err: HttpErrorResponse) =>
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 })
    });

    this.loadLinkedStudents();
  }

  private loadSchool(schoolId: number): void {
    this.schoolService.getSchool(schoolId).subscribe({
      next: (school) => this.schoolName.set(school.schoolName),
      error: (err: HttpErrorResponse) =>
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 })
    });
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
}
