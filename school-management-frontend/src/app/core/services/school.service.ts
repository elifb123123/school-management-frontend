import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api-config';
import { Page } from '../models/page.model';
import { SchoolRequest, SchoolResponse } from '../models/school.model';

export interface SchoolListParams {
  page: number;
  size: number;
  name?: string;
}

@Injectable({ providedIn: 'root' })
export class SchoolService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/api/school`;

  getSchools(params: SchoolListParams): Observable<Page<SchoolResponse>> {
    let httpParams = new HttpParams().set('page', params.page).set('size', params.size);
    if (params.name) {
      httpParams = httpParams.set('name', params.name);
    }
    return this.http.get<Page<SchoolResponse>>(this.baseUrl, { params: httpParams });
  }

  getSchool(id: number): Observable<SchoolResponse> {
    return this.http.get<SchoolResponse>(`${this.baseUrl}/${id}`);
  }

  createSchool(request: SchoolRequest): Observable<SchoolResponse> {
    return this.http.post<SchoolResponse>(this.baseUrl, request);
  }

  updateSchool(id: number, request: SchoolRequest): Observable<SchoolResponse> {
    return this.http.put<SchoolResponse>(`${this.baseUrl}/${id}`, request);
  }

  deleteSchool(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}