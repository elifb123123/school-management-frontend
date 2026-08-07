import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TeacherService } from '../../core/services/teacher.service';
import { SchoolService } from '../../core/services/school.service';
import { TeacherResponse } from '../../core/models/teacher.model';
import { StudentResponse } from '../../core/models/student.model';
import { extractErrorMessage } from '../../core/utils/api-error';
import {
  PeoplePickerDialogComponent,
  PersonOption
} from '../../shared/people-picker-dialog/people-picker-dialog.component';

@Component({
  selector: 'app-teacher-detail',
  imports: [
    RouterLink,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './teacher-detail.component.html',
  styleUrl: './teacher-detail.component.scss'
})
export class TeacherDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly teacherService = inject(TeacherService);
  private readonly schoolService = inject(SchoolService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private readonly schoolId = Number(this.route.snapshot.paramMap.get('schoolId'));
  private readonly teacherId = Number(this.route.snapshot.paramMap.get('teacherId'));

  protected readonly backRoute = `/school/${this.schoolId}`;

  protected readonly profile = signal<TeacherResponse | null>(null);
  protected readonly linkedStudents = signal<StudentResponse[]>([]);
  protected readonly allStudents = signal<StudentResponse[]>([]);
  protected readonly loadingProfile = signal(true);
  protected readonly loadingStudents = signal(true);
  protected readonly linking = signal(false);

  protected readonly availableStudents = computed(() => {
    const linkedIds = new Set(this.linkedStudents().map((s) => s.id));
    return this.allStudents().filter((s) => !linkedIds.has(s.id));
  });

  ngOnInit(): void {
    this.teacherService.getTeacher(this.teacherId).subscribe({
      next: (teacher) => {
        this.profile.set(teacher);
        this.loadingProfile.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingProfile.set(false);
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
      }
    });

    this.schoolService.getStudentsBySchool(this.schoolId, { page: 0, size: 100 }).subscribe({
      next: (page) => this.allStudents.set(page.content),
      error: (err: HttpErrorResponse) =>
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 })
    });

    this.loadLinkedStudents();
  }

  private loadLinkedStudents(): void {
    this.loadingStudents.set(true);
    this.teacherService.getStudentsOfTeacher(this.teacherId).subscribe({
      next: (students) => {
        this.linkedStudents.set(students);
        this.loadingStudents.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingStudents.set(false);
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
      }
    });
  }

  openLinkStudentDialog(): void {
    const dialogRef = this.dialog.open(PeoplePickerDialogComponent, {
      data: {
        title: 'Link a student',
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
