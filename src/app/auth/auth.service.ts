import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequestDTO, RegisterRequestDTO, AuthResponse } from './auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  login(credentials: LoginRequestDTO): Observable<AuthResponse> {
    this.logout(); // Limpiar token antiguo para evitar que el interceptor lo envíe
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials);
  }

  register(data: RegisterRequestDTO): Observable<any> {
    this.logout(); // Limpiar token antiguo para evitar que el interceptor lo envíe
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  // Puedes guardar el token en localStorage para mantener la sesión
  saveToken(token: string) {
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('username');
  }
}
