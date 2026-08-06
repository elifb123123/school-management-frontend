export interface TeacherRequest {
  name: string;
  email: string;
  schoolId: number;
}

export interface TeacherResponse {
  id: number;
  name: string;
  email: string;
  schoolName: string;
}
