/**
 * @file user.service.ts
 * @description Servicio principal de comunicación para el módulo de usuarios.
 * Gestiona el consumo de los endpoints RESTful relacionados con la administración
 * de la cuenta personal del cliente y el panel de control de administradores.
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { User, UpdateProfilePayload, Role, DashboardStats } from '../../shared/models/user.model';
import { PaginatedResult } from '../../shared/models/pagination.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  /* ==========================================================================
     MÓDULO DE PERFIL PERSONAL
     ========================================================================== */

  /**
   * Recupera la información íntegra del usuario actualmente autenticado.
   * @returns {Observable<ApiResponse<User>>} Promesa observable con el modelo de usuario.
   */
  getMe(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`);
  }

  /**
   * Actualiza los metadatos y configuración del perfil personal.
   * @param {UpdateProfilePayload} data - Carga útil con los campos a modificar.
   * @returns {Observable<ApiResponse<User>>} Promesa observable con el registro actualizado.
   */
  updateMe(data: UpdateProfilePayload): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/me`, data);
  }

  /**
   * Procesa la modificación segura de la credencial de acceso del usuario activo.
   * @param {Object} data - Objeto contenedor de la contraseña vigente y la nueva.
   * @returns {Observable<ApiResponse<null>>} Promesa observable con el resultado de la operación.
   */
  updatePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.apiUrl}/me/password`, data);
  }

  /**
   * Solicita la eliminación permanente de la cuenta del usuario autenticado y sus datos asociados.
   * @returns {Observable<ApiResponse<null>>} Promesa observable de confirmación.
   */
  deleteMe(): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/me`);
  }

  /* ==========================================================================
     MÓDULO DE ADMINISTRACIÓN
     ========================================================================== */

  /**
   * Obtiene un listado paginado de los usuarios registrados en el sistema.
   * Requiere privilegios de nivel 'Admin'.
   *
   * @param {number} [page=1] - Índice de la página a consultar.
   * @param {number} [limit=10] - Cantidad de registros por página.
   * @returns {Observable<ApiResponse<PaginatedResult<User>>>} Colección paginada de usuarios.
   */
  getAllUsers(
    page: number = 1,
    limit: number = 10,
  ): Observable<ApiResponse<PaginatedResult<User>>> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    return this.http.get<ApiResponse<PaginatedResult<User>>>(`${this.apiUrl}/admin`, { params });
  }

  /**
   * Modifica el rol de autorización asociado a un usuario específico.
   * @param {string} userId - Identificador unívoco del usuario objetivo.
   * @param {Role} newRole - Nuevo rol a asignar.
   * @returns {Observable<ApiResponse<User>>} Entidad de usuario actualizada.
   */
  changeRole(userId: string, newRole: Role): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/admin/${userId}/role`, {
      role: newRole,
    });
  }

  /**
   * Alterna el estado operativo (alta/baja lógica) de una cuenta de usuario.
   * @param {string} userId - Identificador unívoco del usuario objetivo.
   * @param {boolean} isActive - Booleano indicando el nuevo estado operativo.
   * @returns {Observable<ApiResponse<User>>} Entidad de usuario actualizada.
   */
  toggleUserStatus(userId: string, isActive: boolean): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/admin/${userId}/status`, {
      isActive,
    });
  }

  /**
   * Extrae el conjunto de métricas globales y telemetría requerida para el panel de administración.
   * @returns {Observable<ApiResponse<DashboardStats>>} Estructura de datos consolidada del sistema.
   */
  getDashboardStats(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(`${this.apiUrl}/admin/dashboard-stats`);
  }
}
