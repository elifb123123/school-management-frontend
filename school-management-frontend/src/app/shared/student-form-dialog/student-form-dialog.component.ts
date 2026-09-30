import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface StudentFormDialogResult {
  name: string;
  email: string;
  dateOfBirth: string;
  password?: string;
}

export interface StudentFormDialogData {
  initial?: StudentFormDialogResult;
}

@Component({
  selector: 'app-student-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './student-form-dialog.component.html',
  styleUrl: './student-form-dialog.component.scss'
})
export class StudentFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<StudentFormDialogComponent>);
  private readonly data = inject<StudentFormDialogData | null>(MAT_DIALOG_DATA, {
    optional: true
  });

  protected readonly isEditMode = !!this.data?.initial;

  protected readonly form = new FormGroup({
    name: new FormControl(this.data?.initial?.name ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(20)]
    }),
    email: new FormControl(this.data?.initial?.email ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    dateOfBirth: new FormControl(this.data?.initial?.dateOfBirth ?? '', {
      nonNullable: true,
      validators: Validators.required
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: this.isEditMode ? [] : [Validators.required, Validators.minLength(6)]
    })
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const result: StudentFormDialogResult = this.isEditMode
      ? { name: raw.name, email: raw.email, dateOfBirth: raw.dateOfBirth }
      : { name: raw.name, email: raw.email, dateOfBirth: raw.dateOfBirth, password: raw.password };
    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
