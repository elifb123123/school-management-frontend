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

import { StudentService } from '../../../core/services/student.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { SchoolService } from '../../../core/services/school.service';
import { SessionService } from '../../../core/services/session.service';
import { TeacherResponse } from '../../../core/models/teacher.model';
import { extractErrorMessage } from '../../../core/utils/api-error';
import {
  PeoplePickerDialogComponent,
  PersonOption
} from '../../../shared/people-picker-dialog/people-picker-dialog.component';

@Component({
  selector: 'app-student-teachers',
  imports: [
    RouterLink,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './student-teachers.component.html',
  styleUrl: './student-teachers.component.scss'
})
export class StudentTeachersComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly studentService = inject(StudentService);
  private readonly teacherService = inject(TeacherService);
  private readonly schoolService = inject(SchoolService);
  private readonly sessionService = inject(SessionService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private studentId!: number;

  private readonly isPrincipalScoped = this.sessionService.session()?.role === 'principal';
  protected readonly backRoute = this.isPrincipalScoped ? '/principal/students' : '/students';

  protected readonly studentName = signal('');
  protected readonly linkedTeachers = signal<TeacherResponse[]>([]);
  protected readonly allTeachers = signal<TeacherResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly linking = signal(false);

  protected readonly availableTeachers = computed(() => {
    const linkedIds = new Set(this.linkedTeachers().map((t) => t.id));
    return this.allTeachers().filter((t) => !linkedIds.has(t.id));
  });

  ngOnInit(): void {
    this.studentId = Number(this.route.snapshot.paramMap.get('id'));
    this.loading.set(true);

    this.studentService.getStudent(this.studentId).subscribe({
      next: (student) => this.studentName.set(student.name),
      error: (err: HttpErrorResponse) => this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 })
    });

    const candidates = this.isPrincipalScoped
      ? this.schoolService.getTeachersBySchool(this.sessionService.session()!.entityId, {
          page: 0,
          size: 100
        })
      : this.teacherService.getTeachers({ page: 0, size: 100 });

    candidates.subscribe({
      next: (page) => this.allTeachers.set(page.content),
      error: (err: HttpErrorResponse) => this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 })
    });

    this.loadLinkedTeachers();
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
        title: 'Add a teacher',
        searchPlaceholder: 'Search teachers by name or email',
        emptyMessage: 'No teachers available to link.',
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
