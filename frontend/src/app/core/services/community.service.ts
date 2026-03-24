import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { PaginatedResult } from '../../shared/models/pagination.model';
import {
  Comment,
  Report,
  AddCommentPayload,
  CreateReportPayload,
} from '../../shared/models/community.model';

@Injectable({
  providedIn: 'root',
})
export class CommunityService {
  private http = inject(HttpClient);
  // Asumimos que las rutas en el backend están montadas en /api/v1/community
  private readonly apiUrl = `${environment.apiUrl}/community`;

  // ==========================================
  // Rutas Públicas
  // ==========================================

  /**
   * Obtiene los comentarios de un proyecto con paginación
   * GET /api/v1/community/projects/:projectId/comments
   */
  getProjectComments(
    projectId: string,
    page: number = 1,
    limit: number = 10,
  ): Observable<ApiResponse<PaginatedResult<Comment>>> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http.get<ApiResponse<PaginatedResult<Comment>>>(
      `${this.apiUrl}/projects/${projectId}/comments`,
      { params },
    );
  }

  // ==========================================
  // Rutas Privadas (Requieren Autenticación)
  // ==========================================

  /**
   * Añade un nuevo comentario a un proyecto
   * POST /api/v1/community/projects/:projectId/comments
   */
  addComment(projectId: string, payload: AddCommentPayload): Observable<ApiResponse<Comment>> {
    return this.http.post<ApiResponse<Comment>>(
      `${this.apiUrl}/projects/${projectId}/comments`,
      payload,
    );
  }

  /**
   * Da "Me gusta" a un proyecto
   * POST /api/v1/community/projects/:projectId/like
   */
  likeProject(
    projectId: string,
  ): Observable<ApiResponse<{ likesCount: number; isLikedByMe: boolean }>> {
    return this.http.post<ApiResponse<{ likesCount: number; isLikedByMe: boolean }>>(
      `${this.apiUrl}/projects/${projectId}/like`,
      {},
    );
  }

  /**
   * Crea un reporte sobre un comentario o proyecto
   * POST /api/v1/community/reports
   */
  createReport(payload: CreateReportPayload): Observable<ApiResponse<Report>> {
    return this.http.post<ApiResponse<Report>>(`${this.apiUrl}/reports`, payload);
  }

  // ==========================================
  // Rutas de Administración (Requieren Rol 'Admin')
  // ==========================================

  /**
   * Obtiene la cola de moderación (reportes pendientes)
   * GET /api/v1/community/admin/moderation
   */
  getModerationQueue(
    page: number = 1,
    limit: number = 20,
  ): Observable<ApiResponse<PaginatedResult<Report>>> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http.get<ApiResponse<PaginatedResult<Report>>>(`${this.apiUrl}/admin/moderation`, {
      params,
    });
  }

  /**
   * Resuelve un reporte cambiando su estado (Reviewed o Dismissed)
   * PUT /api/v1/community/admin/moderation/:id
   */
  resolveReport(
    reportId: string,
    action: 'Reviewed' | 'Dismissed',
  ): Observable<ApiResponse<Report>> {
    return this.http.put<ApiResponse<Report>>(`${this.apiUrl}/admin/moderation/${reportId}`, {
      action,
    });
  }

  /**
   * Elimina un comentario a la fuerza como moderador
   * DELETE /api/v1/community/admin/comments/:id
   */
  adminDeleteComment(commentId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/admin/comments/${commentId}`);
  }
}
