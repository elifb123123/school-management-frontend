import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TeacherService } from '../../core/services/teacher.service';
import { StudentService } from '../../core/services/student.service';
import { SessionService, Role } from '../../core/services/session.service';
import { extractErrorMessage } from '../../core/utils/api-error';

interface PickableEntity {
  id: number;
  label: string;
}

type PersonRole = Exclude<Role, 'principal'>;

@Component({
  selector: 'app-session-picker',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './session-picker.component.html',
  styleUrl: './session-picker.component.scss'
})
export class SessionPickerComponent {
  private readonly teacherService = inject(TeacherService);
  private readonly studentService = inject(StudentService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly role = signal<PersonRole | null>(null);
  protected readonly entities = signal<PickableEntity[]>([]);
  protected readonly loading = signal(false);
  protected readonly selectedEntityId = new FormControl<number | null>(null);

  goToSelectSchool(): void {
    this.router.navigate(['/select-school']);
  }

  chooseRole(role: PersonRole): void {
    this.role.set(role);
    this.selectedEntityId.reset();
    this.loading.set(true);

    const onError = (err: HttpErrorResponse) => {
      this.loading.set(false);
      this.snackBar.open(extractErrorMessage(err), 'Close', { duration: 5000 });
    };

    if (role === 'teacher') {
      this.teacherService.getTeachers({ page: 0, size: 100 }).subscribe({
        next: (page) => {
          this.entities.set(page.content.map((t) => ({ id: t.id, label: t.name })));
          this.loading.set(false);
        },
        error: onError
      });
    } else {
      this.studentService.getStudents({ page: 0, size: 100 }).subscribe({
        next: (page) => {
          this.entities.set(page.content.map((s) => ({ id: s.id, label: s.name })));
          this.loading.set(false);
        },
        error: onError
      });
    }
  }

  back(): void {
    this.role.set(null);
    this.entities.set([]);
    this.selectedEntityId.reset();
  }

  continue(): void {
    const role = this.role();
    const entityId = this.selectedEntityId.value;
    if (!role || entityId === null) {
      return;
    }

    const entity = this.entities().find((e) => e.id === entityId);
    this.sessionService.start({ role, entityId, label: entity?.label ?? `#${entityId}` });
    this.router.navigate([`/${role}`]);
  }
}
