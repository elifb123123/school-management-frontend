import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'schools' },
  {
    path: 'schools',
    loadComponent: () =>
      import('./features/schools/school-list/school-list.component').then(
        (m) => m.SchoolListComponent
      )
  },
  {
    path: 'schools/new',
    loadComponent: () =>
      import('./features/schools/school-form/school-form.component').then(
        (m) => m.SchoolFormComponent
      )
  },
  {
    path: 'schools/:id/edit',
    loadComponent: () =>
      import('./features/schools/school-form/school-form.component').then(
        (m) => m.SchoolFormComponent
      )
  }
];