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
  // Añade otros campos si tu backend devuelve más info, como los datos del usuario.
}
