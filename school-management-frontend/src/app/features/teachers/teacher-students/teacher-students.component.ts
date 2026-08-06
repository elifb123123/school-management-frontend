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

import { TeacherService } from '../../../core/services/teacher.service';
import { StudentService } from '../../../core/services/student.service';
import { SchoolService } from '../../../core/services/school.service';
import { SessionService } from '../../../core/services/session.service';
import { StudentResponse } from '../../../core/models/student.model';
import { extractErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-teacher-students',
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
  templateUrl: './teacher-students.component.html',
  styleUrl: './teacher-students.component.scss'
})
export class TeacherStudentsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly teacherService = inject(TeacherService);
  private readonly studentService = inject(StudentService);
  private readonly schoolService = inject(SchoolService);
  private readonly sessionService = inject(SessionService);
  private readonly snackBar = inject(MatSnackBar);

  private teacherId!: number;

  private readonly isPrincipalScoped = this.sessionService.session()?.role === 'principal';
  protected readonly backRoute = this.isPrincipalScoped ? '/principal/teachers' : '/teachers';

  protected readonly teacherName = signal('');
  protected readonly linkedStudents = signal<StudentResponse[]>([]);
  protected readonly allStudents = signal<StudentResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly linking = signal(false);
  protected readonly selectedStudentId = new FormControl<number | null>(null);

  protected readonly availableStudents = computed(() => {
    const linkedIds = new Set(this.linkedStudents().map((s) => s.id));
    return this.allStudents().filter((s) => !linkedIds.has(s.id));
  });

  ngOnInit(): void {
    this.teacherId = Number(this.route.snapshot.paramMap.get('id'));
    this.loading.set(true);

    this.teacherService.getTeacher(this.teacherId).subscribe({
      next: (teacher) => this.teacherName.set(teacher.name),
      error: (err: HttpErrorResponse) => this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 })
    });

    const candidates = this.isPrincipalScoped
      ? this.schoolService.getStudentsBySchool(this.sessionService.session()!.entityId, {
          page: 0,
          size: 100
        })
      : this.studentService.getStudents({ page: 0, size: 100 });

    candidates.subscribe({
      next: (page) => this.allStudents.set(page.content),
      error: (err: HttpErrorResponse) => this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 })
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

  linkSelectedStudent(): void {
    const studentId = this.selectedStudentId.value;
    if (studentId === null) {
      return;
    }

    this.linking.set(true);
    this.teacherService.linkStudent(this.teacherId, studentId).subscribe({
      next: () => {
        this.linking.set(false);
        this.selectedStudentId.reset();
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
