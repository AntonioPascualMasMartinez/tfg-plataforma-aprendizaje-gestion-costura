/**
 * @file auth.service.ts
 * @description Servicio responsable de la gestión de identidad, autenticación y autorización.
 * Interconecta el cliente con los endpoints de seguridad del backend, gestionando el ciclo
 * de vida de la sesión, la emisión de credenciales y los flujos de recuperación de contraseñas.
 */
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

  /**
   * Registra un nuevo usuario en la plataforma.
   * @param {any} userData - Carga útil con los datos de registro (incluye nivel de costura e intereses).
   * @returns {Observable<ApiResponse<User>>} Entidad del usuario recién creado.
   */
  register(userData: any): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/register`, userData);
  }

  /**
   * Autentica a un usuario mediante credenciales tradicionales (email y contraseña).
   * @param {any} credentials - Objeto contenedor de las credenciales de acceso.
   * @returns {Observable<ApiResponse<AuthResponse>>} Objeto con el token de acceso y datos del usuario.
   */
  login(credentials: any): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, credentials, {
      withCredentials: true,
    });
  }

  /**
   * Gestiona la autenticación delegada mediante el proveedor de identidad de Google (OAuth2.0).
   * @param {Object} data - Objeto que contiene el ID Token emitido por Google.
   * @returns {Observable<ApiResponse<AuthResponse>>} Objeto con el token de acceso unificado del sistema.
   */
  googleAuth(data: { idToken: string }): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/google`, data, {
      withCredentials: true,
    });
  }

  /**
   * Solicita la renovación del token de acceso (Access Token) utilizando la cookie HttpOnly vigente.
   * @returns {Observable<ApiResponse<RefreshResponse>>} Nueva credencial de acceso.
   */
  refreshToken(): Observable<ApiResponse<RefreshResponse>> {
    return this.http.post<ApiResponse<RefreshResponse>>(
      `${this.apiUrl}/refresh`,
      {},
      { withCredentials: true },
    );
  }

  /**
   * Finaliza la sesión actual invalidando las cookies de autorización en el servidor.
   * @returns {Observable<ApiResponse<null>>} Confirmación de cierre de sesión.
   */
  logout(): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(
      `${this.apiUrl}/logout`,
      {},
      { withCredentials: true },
    );
  }

  /**
   * Inicia el flujo de recuperación de cuenta enviando un enlace temporal al correo electrónico.
   * @param {string} email - Dirección de correo electrónico asociada a la cuenta.
   * @returns {Observable<ApiResponse<null>>} Confirmación de envío del correo.
   */
  recoverPassword(email: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/recover-password`, { email });
  }

  /**
   * Efectúa el cambio de contraseña utilizando el token criptográfico de recuperación.
   * @param {Object} data - Objeto con el token temporal y la nueva contraseña.
   * @returns {Observable<ApiResponse<null>>} Confirmación de restablecimiento exitoso.
   */
  resetPassword(data: { token: string; newPassword: string }): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/reset-password`, data);
  }
}
