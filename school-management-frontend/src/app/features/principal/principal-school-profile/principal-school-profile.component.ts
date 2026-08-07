import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SchoolService } from '../../../core/services/school.service';
import { SessionService } from '../../../core/services/session.service';
import { SchoolResponse } from '../../../core/models/school.model';
import { extractErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-principal-school-profile',
  imports: [MatIconModule, MatProgressSpinnerModule],
  templateUrl: './principal-school-profile.component.html',
  styleUrl: './principal-school-profile.component.scss'
})
export class PrincipalSchoolProfileComponent implements OnInit {
  private readonly schoolService = inject(SchoolService);
  private readonly sessionService = inject(SessionService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly schoolId = this.sessionService.session()!.entityId;

  protected readonly school = signal<SchoolResponse | null>(null);
  protected readonly teacherCount = signal(0);
  protected readonly studentCount = signal(0);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);

  ngOnInit(): void {
    this.schoolService.getSchool(this.schoolId).subscribe({
      next: (school) => {
        this.school.set(school);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const message = extractErrorMessage(err);
        this.loadError.set(message);
        this.snackBar.open(message, 'Close', { duration: 5000 });
      }
    });

    this.schoolService.getTeachersBySchool(this.schoolId, { page: 0, size: 1 }).subscribe({
      next: (page) => this.teacherCount.set(page.totalElements),
      error: () => {
        // Non-fatal: the profile itself can still render without the count.
      }
    });

    this.schoolService.getStudentsBySchool(this.schoolId, { page: 0, size: 1 }).subscribe({
      next: (page) => this.studentCount.set(page.totalElements),
      error: () => {
        // Non-fatal: the profile itself can still render without the count.
      }
    });
  }
}
