import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SchoolService } from '../../../core/services/school.service';
import { StudentService } from '../../../core/services/student.service';
import { SessionService } from '../../../core/services/session.service';
import { StudentResponse } from '../../../core/models/student.model';
import { extractErrorMessage } from '../../../core/utils/api-error';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-principal-student-list',
  imports: [
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './principal-student-list.component.html',
  styleUrl: './principal-student-list.component.scss'
})
export class PrincipalStudentListComponent implements OnInit {
  private readonly schoolService = inject(SchoolService);
  private readonly studentService = inject(StudentService);
  private readonly sessionService = inject(SessionService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private readonly schoolId = this.sessionService.session()!.entityId;

  protected readonly displayedColumns = ['id', 'name', 'email', 'dateOfBirth', 'age', 'actions'];
  protected readonly students = signal<StudentResponse[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);

  ngOnInit(): void {
    this.loadStudents();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadStudents();
  }

  deleteStudent(student: StudentResponse): void {
    const data: ConfirmDialogData = {
      title: 'Delete student',
      message: `Delete "${student.name}"? This cannot be undone.`
    };

    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.studentService.deleteStudent(student.id).subscribe({
          next: () => {
            this.snackBar.open('Student deleted.', 'Close', { duration: 3000 });
            if (this.students().length === 1 && this.pageIndex() > 0) {
              this.pageIndex.set(this.pageIndex() - 1);
            }
            this.loadStudents();
          },
          error: (err: HttpErrorResponse) => {
            this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
          }
        });
      });
  }

  private loadStudents(): void {
    this.loading.set(true);
    this.schoolService
      .getStudentsBySchool(this.schoolId, { page: this.pageIndex(), size: this.pageSize() })
      .subscribe({
        next: (page) => {
          this.students.set(page.content);
          this.total.set(page.totalElements);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
        }
      });
  }
}
