import { UserRequest } from './auth.model';

export interface TeacherRegistrationRequest {
  userRequest: UserRequest;
  teacherRequest: {
    branch: string;
    schoolId: number;
  };
}

export interface TeacherUpdateRequest {
  userRequest: {
    name: string;
    email: string;
  };
  teacherRequest: {
    branch: string;
    schoolId: number;
  };
}

export interface TeacherResponse {
  id: number;
  name: string;
  email: string;
  branch: string;
  schoolId: number;
}
