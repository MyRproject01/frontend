export interface LoginRequestDTO {
  username: string;
  password?: string;
}

export interface RegisterRequestDTO {
  username: string;
  email: string;
  password?: string;
}

export interface AuthResponse {
  token: string;
}
