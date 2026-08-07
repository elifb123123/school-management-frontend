import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface TeacherFormDialogResult {
  name: string;
  email: string;
}

export interface TeacherFormDialogData {
  initial?: TeacherFormDialogResult;
}

@Component({
  selector: 'app-teacher-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './teacher-form-dialog.component.html',
  styleUrl: './teacher-form-dialog.component.scss'
})
export class TeacherFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<TeacherFormDialogComponent>);
  private readonly data = inject<TeacherFormDialogData | null>(MAT_DIALOG_DATA, {
    optional: true
  });

  protected readonly isEditMode = !!this.data?.initial;

  protected readonly form = new FormGroup({
    name: new FormControl(this.data?.initial?.name ?? '', {
      nonNullable: true,
      validators: Validators.required
    }),
    email: new FormControl(this.data?.initial?.email ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    })
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.getRawValue());
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
