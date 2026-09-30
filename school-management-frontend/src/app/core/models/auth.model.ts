import { SchoolRequest } from './school.model';
import { Role } from '../services/session.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserRequest {
  name: string;
  email: string;
  password: string;
}

export interface PrincipalRegistrationRequest {
  userRequest: UserRequest;
  schoolRequest: SchoolRequest;
}

export interface MeResponse {
  role: Uppercase<Role>;
  entityId: number | null;
  name: string;
}
