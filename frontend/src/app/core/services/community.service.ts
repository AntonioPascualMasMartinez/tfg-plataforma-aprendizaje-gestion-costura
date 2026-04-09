/**
 * @file community.service.ts
 * @description Servicio gestor de la capa social y la moderación de la plataforma.
 * Administra las interacciones de los usuarios (comentarios, valoraciones) y centraliza
 * las denuncias de contenido para su revisión en la cola de moderación administrativa.
 */
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
  private readonly apiUrl = `${environment.apiUrl}/community`;

  /* ==========================================================================
     MÓDULO DE INTERACCIÓN PÚBLICA Y PRIVADA
     ========================================================================== */

  /**
   * Recupera la colección de comentarios asociados a un proyecto específico.
   * @param {string} projectId - Identificador único del proyecto.
   * @param {number} [page=1] - Índice de la página solicitada.
   * @param {number} [limit=10] - Cantidad de registros por página.
   * @returns {Observable<ApiResponse<PaginatedResult<Comment>>>} Listado paginado de comentarios.
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

  /**
   * Inserta un nuevo comentario en la base de datos vinculado a un proyecto.
   * @param {string} projectId - Identificador único del proyecto.
   * @param {AddCommentPayload} payload - Estructura de datos del comentario.
   * @returns {Observable<ApiResponse<Comment>>} Comentario persistido.
   */
  addComment(projectId: string, payload: AddCommentPayload): Observable<ApiResponse<Comment>> {
    return this.http.post<ApiResponse<Comment>>(
      `${this.apiUrl}/projects/${projectId}/comments`,
      payload,
    );
  }

  /**
   * Ejecuta o revierte una valoración positiva ("Me gusta") sobre un proyecto.
   * @param {string} projectId - Identificador único del proyecto a valorar.
   * @returns {Observable<ApiResponse<{ likesCount: number; isLikedByMe: boolean }>>} Estado actualizado de las métricas.
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
   * Genera un reporte de moderación contra contenido potencialmente inapropiado.
   * @param {CreateReportPayload} payload - Detalles de la infracción reportada.
   * @returns {Observable<ApiResponse<Report>>} Registro del reporte generado.
   */
  createReport(payload: CreateReportPayload): Observable<ApiResponse<Report>> {
    return this.http.post<ApiResponse<Report>>(`${this.apiUrl}/reports`, payload);
  }

  /* ==========================================================================
     MÓDULO DE ADMINISTRACIÓN Y MODERACIÓN (Requiere Rol 'Admin')
     ========================================================================== */

  /**
   * Extrae la cola de moderación del sistema, aplicando filtros por estado de resolución.
   * @param {number} [page=1] - Índice de paginación.
   * @param {number} [limit=20] - Límite de elementos a recuperar.
   * @param {string} [status='Pending'] - Filtro de estado del reporte (ej. Pending, Reviewed).
   * @returns {Observable<ApiResponse<PaginatedResult<Report>>>} Listado de incidencias.
   */
  getModerationQueue(
    page: number = 1,
    limit: number = 20,
    status: string = 'Pending',
  ): Observable<ApiResponse<PaginatedResult<Report>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('status', status);

    return this.http.get<ApiResponse<PaginatedResult<Report>>>(`${this.apiUrl}/admin/moderation`, {
      params,
    });
  }

  /**
   * Actualiza el estado de revisión de un reporte de moderación.
   * @param {string} reportId - Identificador del reporte.
   * @param {'Reviewed' | 'Dismissed' | 'Pending'} action - Nueva directiva de estado.
   * @returns {Observable<ApiResponse<Report>>} Entidad del reporte actualizada.
   */
  resolveReport(
    reportId: string,
    action: 'Reviewed' | 'Dismissed' | 'Pending',
  ): Observable<ApiResponse<Report>> {
    return this.http.put<ApiResponse<Report>>(`${this.apiUrl}/admin/moderation/${reportId}`, {
      action,
    });
  }

  /**
   * Elimina de manera forzosa un comentario del sistema (Acción administrativa).
   * @param {string} commentId - Identificador del comentario a purgar.
   * @returns {Observable<ApiResponse<null>>} Confirmación de borrado.
   */
  adminDeleteComment(commentId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/admin/comments/${commentId}`);
  }
}
