import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api-config';
import { Page } from '../models/page.model';
import { TeacherRequest, TeacherResponse } from '../models/teacher.model';
import { StudentResponse } from '../models/student.model';

export interface TeacherListParams {
  page: number;
  size: number;
  name?: string;
}

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/api/teacher`;

  getTeachers(params: TeacherListParams): Observable<Page<TeacherResponse>> {
    let httpParams = new HttpParams().set('page', params.page).set('size', params.size);
    if (params.name) {
      httpParams = httpParams.set('name', params.name);
    }
    return this.http.get<Page<TeacherResponse>>(this.baseUrl, { params: httpParams });
  }

  getTeacher(id: number): Observable<TeacherResponse> {
    return this.http.get<TeacherResponse>(`${this.baseUrl}/${id}`);
  }

  createTeacher(request: TeacherRequest): Observable<TeacherResponse> {
    return this.http.post<TeacherResponse>(this.baseUrl, request);
  }

  updateTeacher(id: number, request: TeacherRequest): Observable<TeacherResponse> {
    return this.http.put<TeacherResponse>(`${this.baseUrl}/${id}`, request);
  }

  deleteTeacher(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getStudentsOfTeacher(teacherId: number): Observable<StudentResponse[]> {
    return this.http.get<StudentResponse[]>(`${this.baseUrl}/${teacherId}/students`);
  }

  linkStudent(teacherId: number, studentId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${teacherId}/students/${studentId}/link`, null);
  }

  unlinkStudent(teacherId: number, studentId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${teacherId}/students/${studentId}/unlink`);
  }
}
