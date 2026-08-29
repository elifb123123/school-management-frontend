import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api-config';
import { Page } from '../models/page.model';
import {
  StudentRegistrationRequest,
  StudentRequest,
  StudentResponse
} from '../models/student.model';
import { TeacherResponse } from '../models/teacher.model';
import { UserResponse } from '../models/user.model';

export interface StudentListParams {
  page: number;
  size: number;
  name?: string;
  email?: string;
  birthDate?: string;
}

@Injectable({ providedIn: 'root' })
export class StudentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/api/student`;

  getStudents(params: StudentListParams): Observable<Page<StudentResponse>> {
    let httpParams = new HttpParams().set('page', params.page).set('size', params.size);
    if (params.name) {
      httpParams = httpParams.set('name', params.name);
    }
    if (params.email) {
      httpParams = httpParams.set('email', params.email);
    }
    if (params.birthDate) {
      httpParams = httpParams.set('birthDate', params.birthDate);
    }
    return this.http.get<Page<StudentResponse>>(this.baseUrl, { params: httpParams });
  }

  getStudent(id: number): Observable<StudentResponse> {
    return this.http.get<StudentResponse>(`${this.baseUrl}/${id}`);
  }

  registerStudent(request: StudentRegistrationRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${API_BASE_URL}/api/register/student`, request);
  }

  updateStudent(id: number, request: StudentRequest): Observable<StudentResponse> {
    return this.http.put<StudentResponse>(`${this.baseUrl}/${id}`, request);
  }

  deleteStudent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getTeachersOfStudent(studentId: number): Observable<TeacherResponse[]> {
    return this.http.get<TeacherResponse[]>(`${this.baseUrl}/${studentId}/teachers`);
  }

  linkTeacher(studentId: number, teacherId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${studentId}/teachers/${teacherId}/link`, null);
  }

  unlinkTeacher(studentId: number, teacherId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${studentId}/teachers/${teacherId}/unlink`);
  }
}
