import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SchoolService } from '../../core/services/school.service';
import { SessionService } from '../../core/services/session.service';
import { SchoolResponse } from '../../core/models/school.model';
import { extractErrorMessage } from '../../core/utils/api-error';

@Component({
  selector: 'app-select-school',
  imports: [MatIconModule, MatProgressSpinnerModule],
  templateUrl: './select-school.component.html',
  styleUrl: './select-school.component.scss'
})
export class SelectSchoolComponent implements OnInit {
  private readonly schoolService = inject(SchoolService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly schools = signal<SchoolResponse[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.schoolService.getSchools({ page: 0, size: 100 }).subscribe({
      next: (page) => {
        this.schools.set(page.content);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
      }
    });
  }

  selectSchool(school: SchoolResponse): void {
    this.sessionService.start({
      role: 'principal',
      entityId: school.id,
      label: school.schoolName
    });
    this.router.navigate(['/school', school.id]);
  }
}
