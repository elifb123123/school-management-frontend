export interface StudentRequest {
  name: string;
  email: string;
  dateOfBirth: string;
  schoolId: number;
}

export interface StudentResponse {
  id: number;
  name: string;
  email: string;
  dateOfBirth: string;
  age: number;
  schoolName: string;
}
