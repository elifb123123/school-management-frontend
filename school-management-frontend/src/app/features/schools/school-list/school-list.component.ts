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

import { SchoolService } from '../../../core/services/school.service';
import { SchoolResponse } from '../../../core/models/school.model';
import { extractErrorMessage } from '../../../core/utils/api-error';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-school-list',
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
  templateUrl: './school-list.component.html',
  styleUrl: './school-list.component.scss'
})
export class SchoolListComponent implements OnInit, OnDestroy {
  private readonly schoolService = inject(SchoolService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyed$ = new Subject<void>();

  protected readonly displayedColumns = ['id', 'schoolName', 'address', 'actions'];
  protected readonly nameFilter = new FormControl('', { nonNullable: true });

  protected readonly schools = signal<SchoolResponse[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);

  ngOnInit(): void {
    this.loadSchools();

    this.nameFilter.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroyed$))
      .subscribe(() => {
        this.pageIndex.set(0);
        this.loadSchools();
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadSchools();
  }

  deleteSchool(school: SchoolResponse): void {
    const data: ConfirmDialogData = {
      title: 'Delete school',
      message: `Delete "${school.schoolName}"? This cannot be undone.`
    };

    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.schoolService.deleteSchool(school.id).subscribe({
          next: () => {
            this.snackBar.open('School deleted.', 'Close', { duration: 3000 });
            if (this.schools().length === 1 && this.pageIndex() > 0) {
              this.pageIndex.set(this.pageIndex() - 1);
            }
            this.loadSchools();
          },
          error: (err: HttpErrorResponse) => {
            this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
          }
        });
      });
  }

  private loadSchools(): void {
    this.loading.set(true);
    this.schoolService
      .getSchools({
        page: this.pageIndex(),
        size: this.pageSize(),
        name: this.nameFilter.value || undefined
      })
      .subscribe({
        next: (page) => {
          this.schools.set(page.content);
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