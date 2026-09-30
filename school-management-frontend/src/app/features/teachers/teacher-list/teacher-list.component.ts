import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TeacherService } from '../../../core/services/teacher.service';
import { SchoolService } from '../../../core/services/school.service';
import { TeacherResponse } from '../../../core/models/teacher.model';
import { extractErrorMessage } from '../../../core/utils/api-error';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-teacher-list',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './teacher-list.component.html',
  styleUrl: './teacher-list.component.scss'
})
export class TeacherListComponent implements OnInit, OnDestroy {
  private readonly teacherService = inject(TeacherService);
  private readonly schoolService = inject(SchoolService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyed$ = new Subject<void>();

  private readonly schoolNames = signal<Map<number, string>>(new Map());

  protected readonly displayedColumns = ['id', 'name', 'email', 'schoolName', 'actions'];
  protected readonly nameFilter = new FormControl('', { nonNullable: true });

  protected readonly teachers = signal<TeacherResponse[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);

  ngOnInit(): void {
    this.loadTeachers();

    this.schoolService.getSchools({ page: 0, size: 100 }).subscribe({
      next: (page) => this.schoolNames.set(new Map(page.content.map((s) => [s.id, s.schoolName])))
    });

    this.nameFilter.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroyed$))
      .subscribe(() => {
        this.pageIndex.set(0);
        this.loadTeachers();
      });
  }

  protected schoolNameFor(schoolId: number): string {
    return this.schoolNames().get(schoolId) ?? '';
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
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
    this.teacherService
      .getTeachers({
        page: this.pageIndex(),
        size: this.pageSize(),
        name: this.nameFilter.value || undefined
      })
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
