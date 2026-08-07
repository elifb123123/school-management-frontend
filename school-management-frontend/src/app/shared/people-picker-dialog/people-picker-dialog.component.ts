import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface PersonOption {
  id: number;
  name: string;
  email: string;
}

export interface PeoplePickerDialogData {
  title: string;
  searchPlaceholder: string;
  emptyMessage: string;
  people: PersonOption[];
}

@Component({
  selector: 'app-people-picker-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './people-picker-dialog.component.html',
  styleUrl: './people-picker-dialog.component.scss'
})
export class PeoplePickerDialogComponent {
  protected readonly data = inject<PeoplePickerDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<PeoplePickerDialogComponent>);

  protected readonly search = new FormControl('', { nonNullable: true });
  private readonly searchValue = toSignal(this.search.valueChanges, { initialValue: '' });

  protected readonly filteredPeople = computed(() => {
    const query = this.searchValue().trim().toLowerCase();
    if (!query) {
      return this.data.people;
    }
    return this.data.people.filter(
      (p) => p.name.toLowerCase().includes(query) || p.email.toLowerCase().includes(query)
    );
  });

  select(person: PersonOption): void {
    this.dialogRef.close(person);
  }

  selectFirstMatch(): void {
    const first = this.filteredPeople()[0];
    if (first) {
      this.select(first);
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
