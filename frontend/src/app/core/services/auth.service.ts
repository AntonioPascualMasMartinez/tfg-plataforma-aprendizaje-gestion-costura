import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { AuthResponse, RefreshResponse } from '../../shared/models/auth.model';
import { User } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  // POST /api/v1/auth/register
  // El userData ahora puede incluir opcionalmente 'sewingLevel' e 'interests'
  register(userData: any): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/register`, userData);
  }

  // POST /api/v1/auth/login
  login(credentials: any): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, credentials, {
      withCredentials: true,
    });
  }

  // ==========================================
  // NUEVO: Autenticación con Google
  // ==========================================
  // POST /api/v1/auth/google
  googleAuth(data: { idToken: string }): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/google`, data, {
      withCredentials: true,
    });
  }

  // POST /api/v1/auth/refresh
  refreshToken(): Observable<ApiResponse<RefreshResponse>> {
    return this.http.post<ApiResponse<RefreshResponse>>(
      `${this.apiUrl}/refresh`,
      {},
      { withCredentials: true },
    );
  }

  // POST /api/v1/auth/logout
  logout(): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(
      `${this.apiUrl}/logout`,
      {},
      { withCredentials: true },
    );
  }

  // POST /api/v1/auth/recover-password
  recoverPassword(email: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/recover-password`, { email });
  }

  // POST /api/v1/auth/reset-password
  // Lo adaptamos para que pueda recibir un objeto (como lo configuramos en el componente reset-password)
  resetPassword(data: { token: string; newPassword: string }): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/reset-password`, data);
  }
}
