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
import { TeacherService } from '../../../core/services/teacher.service';
import { SessionService } from '../../../core/services/session.service';
import { TeacherResponse } from '../../../core/models/teacher.model';
import { extractErrorMessage } from '../../../core/utils/api-error';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-principal-teacher-list',
  imports: [
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './principal-teacher-list.component.html',
  styleUrl: './principal-teacher-list.component.scss'
})
export class PrincipalTeacherListComponent implements OnInit {
  private readonly schoolService = inject(SchoolService);
  private readonly teacherService = inject(TeacherService);
  private readonly sessionService = inject(SessionService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private readonly schoolId = this.sessionService.session()!.entityId;

  protected readonly displayedColumns = ['id', 'name', 'email', 'actions'];
  protected readonly teachers = signal<TeacherResponse[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);

  ngOnInit(): void {
    this.loadTeachers();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadTeachers();
  }

  deleteTeacher(teacher: TeacherResponse): void {
    const data: ConfirmDialogData = {
      title: 'Delete teacher',
      message: `Delete "${teacher.name}"? This cannot be undone.`
    };

    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.teacherService.deleteTeacher(teacher.id).subscribe({
          next: () => {
            this.snackBar.open('Teacher deleted.', 'Close', { duration: 3000 });
            if (this.teachers().length === 1 && this.pageIndex() > 0) {
              this.pageIndex.set(this.pageIndex() - 1);
            }
            this.loadTeachers();
          },
          error: (err: HttpErrorResponse) => {
            this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
          }
        });
      });
  }

  private loadTeachers(): void {
    this.loading.set(true);
    this.schoolService
      .getTeachersBySchool(this.schoolId, { page: this.pageIndex(), size: this.pageSize() })
      .subscribe({
        next: (page) => {
          this.teachers.set(page.content);
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
