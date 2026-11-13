export type Role = "MENTOR" | "ASPIRANT";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
}

/** Shape returned by POST /api/auth/login - mirrors LoginResponse.java exactly. */
export interface LoginApiResponse {
  token: string;
  userId: string;
  email: string;
  displayName: string;
  role: Role;
}

/** Account row in the mentor's Users (admin) page - mirrors AdminUserDto.java. */
export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  active: boolean;
  createdAt: string;
}
