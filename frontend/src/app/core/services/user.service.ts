import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { User, UpdateProfilePayload, Role } from '../../shared/models/user.model';
import { PaginatedResult } from '../../shared/models/pagination.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  // ==========================================
  // Rutas de Perfil Personal
  // ==========================================

  // GET /api/v1/users/me
  getMe(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`);
  }

  // PUT /api/v1/users/me
  updateMe(data: UpdateProfilePayload): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/me`, data);
  }

  // ==========================================
  // Rutas Administrativas
  // ==========================================

  // GET /api/v1/users/admin
  getAllUsers(
    page: number = 1,
    limit: number = 10,
  ): Observable<ApiResponse<PaginatedResult<User>>> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http.get<ApiResponse<PaginatedResult<User>>>(`${this.apiUrl}/admin`, { params });
  }

  // PUT /api/v1/users/admin/:id/role
  changeRole(userId: string, newRole: Role): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/admin/${userId}/role`, {
      role: newRole,
    });
  }
}
