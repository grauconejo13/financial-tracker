export interface User {
  id: string;
  email: string;
  displayName?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}