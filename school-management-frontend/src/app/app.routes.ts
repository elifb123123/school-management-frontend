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
  },
  {
    path: 'teachers',
    loadComponent: () =>
      import('./features/teachers/teacher-list/teacher-list.component').then(
        (m) => m.TeacherListComponent
      )
  },
  {
    path: 'teachers/new',
    loadComponent: () =>
      import('./features/teachers/teacher-form/teacher-form.component').then(
        (m) => m.TeacherFormComponent
      )
  },
  {
    path: 'teachers/:id/edit',
    loadComponent: () =>
      import('./features/teachers/teacher-form/teacher-form.component').then(
        (m) => m.TeacherFormComponent
      )
  },
  {
    path: 'students',
    loadComponent: () =>
      import('./features/students/student-list/student-list.component').then(
        (m) => m.StudentListComponent
      )
  },
  {
    path: 'students/new',
    loadComponent: () =>
      import('./features/students/student-form/student-form.component').then(
        (m) => m.StudentFormComponent
      )
  },
  {
    path: 'students/:id/edit',
    loadComponent: () =>
      import('./features/students/student-form/student-form.component').then(
        (m) => m.StudentFormComponent
      )
  }
];