import { Routes } from '@angular/router';

import { sessionGuard } from './core/guards/session.guard';
import { schoolDashboardGuard } from './core/guards/school-dashboard.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/session-picker/session-picker.component').then(
        (m) => m.SessionPickerComponent
      )
  },
  {
    path: 'select-school',
    loadComponent: () =>
      import('./features/select-school/select-school.component').then(
        (m) => m.SelectSchoolComponent
      )
  },
  {
    path: 'school/:schoolId',
    canActivate: [schoolDashboardGuard],
    loadComponent: () =>
      import('./features/school-dashboard/school-dashboard.component').then(
        (m) => m.SchoolDashboardComponent
      )
  },

  // --- Legacy principal admin pages (scoped to their own school) — no longer
  // linked from the picker (superseded by /select-school + /school/:schoolId
  // above), but left in place rather than deleted since they're still working
  // CRUD screens that a later step will likely fold back in. ---
  { path: 'principal', pathMatch: 'full', redirectTo: 'principal/school' },
  {
    path: 'principal/school',
    canActivate: [sessionGuard],
    data: { role: 'principal' },
    loadComponent: () =>
      import(
        './features/principal/principal-school-profile/principal-school-profile.component'
      ).then((m) => m.PrincipalSchoolProfileComponent)
  },
  {
    path: 'principal/school/edit',
    canActivate: [sessionGuard],
    data: { role: 'principal' },
    loadComponent: () =>
      import('./features/principal/principal-school-edit/principal-school-edit.component').then(
        (m) => m.PrincipalSchoolEditComponent
      )
  },
  {
    path: 'principal/teachers',
    canActivate: [sessionGuard],
    data: { role: 'principal' },
    loadComponent: () =>
      import('./features/principal/principal-teacher-list/principal-teacher-list.component').then(
        (m) => m.PrincipalTeacherListComponent
      )
  },
  {
    path: 'principal/teachers/new',
    canActivate: [sessionGuard],
    data: { role: 'principal' },
    loadComponent: () =>
      import('./features/teachers/teacher-form/teacher-form.component').then(
        (m) => m.TeacherFormComponent
      )
  },
  {
    path: 'principal/teachers/:id/edit',
    canActivate: [sessionGuard],
    data: { role: 'principal' },
    loadComponent: () =>
      import('./features/teachers/teacher-form/teacher-form.component').then(
        (m) => m.TeacherFormComponent
      )
  },
  {
    path: 'principal/teachers/:id/students',
    canActivate: [sessionGuard],
    data: { role: 'principal' },
    loadComponent: () =>
      import('./features/teachers/teacher-students/teacher-students.component').then(
        (m) => m.TeacherStudentsComponent
      )
  },
  {
    path: 'principal/students',
    canActivate: [sessionGuard],
    data: { role: 'principal' },
    loadComponent: () =>
      import('./features/principal/principal-student-list/principal-student-list.component').then(
        (m) => m.PrincipalStudentListComponent
      )
  },
  {
    path: 'principal/students/new',
    canActivate: [sessionGuard],
    data: { role: 'principal' },
    loadComponent: () =>
      import('./features/students/student-form/student-form.component').then(
        (m) => m.StudentFormComponent
      )
  },
  {
    path: 'principal/students/:id/edit',
    canActivate: [sessionGuard],
    data: { role: 'principal' },
    loadComponent: () =>
      import('./features/students/student-form/student-form.component').then(
        (m) => m.StudentFormComponent
      )
  },
  {
    path: 'principal/students/:id/teachers',
    canActivate: [sessionGuard],
    data: { role: 'principal' },
    loadComponent: () =>
      import('./features/students/student-teachers/student-teachers.component').then(
        (m) => m.StudentTeachersComponent
      )
  },

  // --- Teacher (own profile + own students) ---
  {
    path: 'teacher',
    canActivate: [sessionGuard],
    data: { role: 'teacher' },
    loadComponent: () =>
      import('./features/teacher-dashboard/teacher-dashboard.component').then(
        (m) => m.TeacherDashboardComponent
      )
  },
  {
    path: 'teacher/edit',
    canActivate: [sessionGuard],
    data: { role: 'teacher' },
    loadComponent: () =>
      import('./features/teachers/teacher-form/teacher-form.component').then(
        (m) => m.TeacherFormComponent
      )
  },

  // --- Student (own profile + own teachers) ---
  {
    path: 'student',
    canActivate: [sessionGuard],
    data: { role: 'student' },
    loadComponent: () =>
      import('./features/student-dashboard/student-dashboard.component').then(
        (m) => m.StudentDashboardComponent
      )
  },
  {
    path: 'student/edit',
    canActivate: [sessionGuard],
    data: { role: 'student' },
    loadComponent: () =>
      import('./features/students/student-form/student-form.component').then(
        (m) => m.StudentFormComponent
      )
  },

  // --- Legacy unscoped admin routes (no role fits "browse everything across all
  // schools" today, so nothing links here anymore, but the working screens are left
  // in place rather than deleted) ---
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
    path: 'teachers/:id/students',
    loadComponent: () =>
      import('./features/teachers/teacher-students/teacher-students.component').then(
        (m) => m.TeacherStudentsComponent
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
  },
  {
    path: 'students/:id/teachers',
    loadComponent: () =>
      import('./features/students/student-teachers/student-teachers.component').then(
        (m) => m.StudentTeachersComponent
      )
  }
];
