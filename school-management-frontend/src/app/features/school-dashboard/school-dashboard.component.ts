import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SchoolService } from '../../core/services/school.service';
import { SchoolResponse } from '../../core/models/school.model';
import { TeacherResponse } from '../../core/models/teacher.model';
import { StudentResponse } from '../../core/models/student.model';
import { extractErrorMessage } from '../../core/utils/api-error';

type DashboardTab = 'teachers' | 'students';

@Component({
  selector: 'app-school-dashboard',
  imports: [MatIconModule, MatListModule, MatButtonToggleModule, MatProgressSpinnerModule],
  templateUrl: './school-dashboard.component.html',
  styleUrl: './school-dashboard.component.scss'
})
export class SchoolDashboardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly schoolService = inject(SchoolService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly schoolId = Number(this.route.snapshot.paramMap.get('schoolId'));

  protected readonly school = signal<SchoolResponse | null>(null);
  protected readonly teacherCount = signal(0);
  protected readonly studentCount = signal(0);
  protected readonly loadingProfile = signal(true);
  protected readonly profileError = signal<string | null>(null);

  protected readonly activeTab = signal<DashboardTab>('teachers');

  protected readonly teachers = signal<TeacherResponse[]>([]);
  protected readonly loadingTeachers = signal(false);
  private teachersLoaded = false;

  protected readonly students = signal<StudentResponse[]>([]);
  protected readonly loadingStudents = signal(false);
  private studentsLoaded = false;

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
