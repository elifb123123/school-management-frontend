import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { StudentResponse } from '../../core/models/student.model';
import { TeacherResponse } from '../../core/models/teacher.model';
import { extractErrorMessage } from '../../core/utils/api-error';
import {
  PeoplePickerDialogComponent,
  PersonOption
} from '../../shared/people-picker-dialog/people-picker-dialog.component';

@Component({
  selector: 'app-student-detail',
  imports: [
    RouterLink,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './student-detail.component.html',
  styleUrl: './student-detail.component.scss'
})
export class StudentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly studentService = inject(StudentService);
  private readonly schoolService = inject(SchoolService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private readonly schoolId = Number(this.route.snapshot.paramMap.get('schoolId'));
  private readonly studentId = Number(this.route.snapshot.paramMap.get('studentId'));

  protected readonly backRoute = `/school/${this.schoolId}`;

  protected readonly profile = signal<StudentResponse | null>(null);
  protected readonly linkedTeachers = signal<TeacherResponse[]>([]);
  protected readonly allTeachers = signal<TeacherResponse[]>([]);
  protected readonly loadingProfile = signal(true);
  protected readonly loadingTeachers = signal(true);
  protected readonly linking = signal(false);

  protected readonly availableTeachers = computed(() => {
    const linkedIds = new Set(this.linkedTeachers().map((t) => t.id));
    return this.allTeachers().filter((t) => !linkedIds.has(t.id));
  });

  ngOnInit(): void {
    this.studentService.getStudent(this.studentId).subscribe({
      next: (student) => {
        this.profile.set(student);
        this.loadingProfile.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingProfile.set(false);
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
      }
    });

    this.schoolService.getTeachersBySchool(this.schoolId, { page: 0, size: 100 }).subscribe({
      next: (page) => this.allTeachers.set(page.content),
      error: (err: HttpErrorResponse) =>
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 })
    });

    this.loadLinkedTeachers();
  }

  private loadLinkedTeachers(): void {
    this.loadingTeachers.set(true);
    this.studentService.getTeachersOfStudent(this.studentId).subscribe({
      next: (teachers) => {
        this.linkedTeachers.set(teachers);
        this.loadingTeachers.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingTeachers.set(false);
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
      }
    });
  }

  viewTeacher(teacher: TeacherResponse): void {
    this.router.navigate(['/school', this.schoolId, 'teachers', teacher.id]);
  }

  openLinkTeacherDialog(): void {
    const dialogRef = this.dialog.open(PeoplePickerDialogComponent, {
      data: {
        title: 'Link a teacher',
        searchPlaceholder: 'Search teachers by name or email',
        emptyMessage: 'No teachers available to link.',
        people: this.availableTeachers().map(
          (t): PersonOption => ({ id: t.id, name: t.name, email: t.email })
        ),
        linkToDetail: { schoolId: this.schoolId, kind: 'teacher' }
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
