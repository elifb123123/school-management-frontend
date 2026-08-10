import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { formatBranch } from '../../core/utils/format-branch';

export interface TeacherFormDialogResult {
  name: string;
  email: string;
  branch: string;
}

export interface TeacherFormDialogData {
  initial?: TeacherFormDialogResult;
  branches: string[];
}

@Component({
  selector: 'app-teacher-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './teacher-form-dialog.component.html',
  styleUrl: './teacher-form-dialog.component.scss'
})
export class TeacherFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<TeacherFormDialogComponent>);
  protected readonly data = inject<TeacherFormDialogData>(MAT_DIALOG_DATA);

  protected readonly isEditMode = !!this.data.initial;
  protected readonly formatBranch = formatBranch;

  protected readonly form = new FormGroup({
    name: new FormControl(this.data.initial?.name ?? '', {
      nonNullable: true,
      validators: Validators.required
    }),
    email: new FormControl(this.data.initial?.email ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    branch: new FormControl(this.data.initial?.branch ?? '', {
      nonNullable: true,
      validators: Validators.required
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
