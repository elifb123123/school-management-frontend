import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { StudentService } from '../../../core/services/student.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { SchoolService } from '../../../core/services/school.service';
import { SessionService } from '../../../core/services/session.service';
import { TeacherResponse } from '../../../core/models/teacher.model';
import { extractErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-student-teachers',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatListModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
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
  private readonly snackBar = inject(MatSnackBar);

  private studentId!: number;

  private readonly isPrincipalScoped = this.sessionService.session()?.role === 'principal';
  protected readonly backRoute = this.isPrincipalScoped ? '/principal/students' : '/students';

  protected readonly studentName = signal('');
  protected readonly linkedTeachers = signal<TeacherResponse[]>([]);
  protected readonly allTeachers = signal<TeacherResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly linking = signal(false);
  protected readonly selectedTeacherId = new FormControl<number | null>(null);

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
