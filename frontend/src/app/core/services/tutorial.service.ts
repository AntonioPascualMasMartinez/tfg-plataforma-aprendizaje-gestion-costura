import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { PaginatedResult } from '../../shared/models/pagination.model';
import {
  Tutorial,
  TutorialProgress,
  StartTutorialResponse,
} from '../../shared/models/tutorial.model';

@Injectable({
  providedIn: 'root',
})
export class TutorialService {
  private http = inject(HttpClient);
  // Asumiendo que tu ruta base en Express es /api/v1/tutorials
  private readonly apiUrl = `${environment.apiUrl}/tutorials`;

  // ==========================================
  // Rutas Públicas
  // ==========================================

  /**
   * Obtiene el catálogo paginado de tutoriales disponibles
   * GET /api/v1/tutorials
   */
  getCatalog(
    page: number = 1,
    limit: number = 10,
    category?: string,
  ): Observable<ApiResponse<PaginatedResult<Tutorial>>> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    if (category) {
      params = params.set('category', category);
    }

    return this.http.get<ApiResponse<PaginatedResult<Tutorial>>>(this.apiUrl, { params });
  }

  // ==========================================
  // Rutas Privadas (Requieren Autenticación vía Interceptor)
  // ==========================================

  /**
   * Inicia un tutorial guiado (Clona el proyecto en el espacio del usuario)
   * POST /api/v1/tutorials/:id/start
   */
  startTutorial(tutorialId: string): Observable<ApiResponse<StartTutorialResponse>> {
    // El cuerpo va vacío {} ya que el ID va en la URL y el usuario en el token
    return this.http.post<ApiResponse<StartTutorialResponse>>(
      `${this.apiUrl}/${tutorialId}/start`,
      {},
    );
  }

  /**
   * Actualiza el paso actual del tutorial para calcular el porcentaje de progreso
   * PUT /api/v1/tutorials/:id/progress
   */
  updateProgress(
    tutorialId: string,
    currentStep: number,
  ): Observable<ApiResponse<TutorialProgress>> {
    return this.http.put<ApiResponse<TutorialProgress>>(`${this.apiUrl}/${tutorialId}/progress`, {
      currentStep,
    });
  }
}
