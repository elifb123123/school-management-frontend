import { HttpErrorResponse } from '@angular/common/http';

interface ProblemDetail {
  title?: string;
  detail?: string;
  errors?: Record<string, string>;
}

export function extractErrorMessage(err: HttpErrorResponse): string {
  const body = err.error as ProblemDetail | null;

  if (body?.errors && Object.keys(body.errors).length > 0) {
    return Object.values(body.errors).join(' ');
  }

  if (body?.detail) {
    return body.detail;
  }

  return `Request failed (${err.status}).`;
}