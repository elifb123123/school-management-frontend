import { UserRequest } from './auth.model';

export interface StudentRequest {
  name: string;
  email: string;
  dateOfBirth: string;
  schoolId: number;
}

export interface StudentRegistrationRequest {
  userRequest: UserRequest;
  studentRequest: {
    dateOfBirth: string;
    schoolId: number;
  };
}

export interface StudentResponse {
  id: number;
  name: string;
  email: string;
  dateOfBirth: string;
  age: number;
  schoolId: number;
}
