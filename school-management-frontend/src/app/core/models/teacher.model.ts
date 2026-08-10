export interface TeacherRequest {
  name: string;
  email: string;
  branch: string;
  schoolId: number;
}

export interface TeacherResponse {
  id: number;
  name: string;
  email: string;
  branch: string;
  schoolName: string;
}
