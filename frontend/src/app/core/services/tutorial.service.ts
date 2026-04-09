/**
 * @file tutorial.service.ts
 * @description Servicio gestor de la biblioteca de tutoriales y formación.
 * Proporciona acceso al catálogo educativo, realiza el seguimiento analítico del progreso
 * del estudiante e incluye los métodos de orquestación de contenido para administradores.
 */
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
  CreateTutorialPayload,
} from '../../shared/models/tutorial.model';

@Injectable({
  providedIn: 'root',
})
export class TutorialService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/tutorials`;

  /* ==========================================================================
     MÓDULO DE CATÁLOGO (Acceso Público)
     ========================================================================== */

  /**
   * Recupera la oferta formativa del sistema segmentada y paginada.
   * @param {number} [page=1] - Índice de la vista actual.
   * @param {number} [limit=10] - Cantidad de tutoriales mostrados.
   * @param {string} [category] - Filtro temático o categoría.
   * @param {string} [difficultyLevel] - Nivel de complejidad requerido.
   * @param {number} [maxTime] - Umbral máximo de duración estimada (minutos).
   * @returns {Observable<ApiResponse<PaginatedResult<Tutorial>>>} Catálogo estructurado.
   */
  getCatalog(
    page: number = 1,
    limit: number = 10,
    category?: string,
    difficultyLevel?: string,
    maxTime?: number,
  ): Observable<ApiResponse<PaginatedResult<Tutorial>>> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    if (category) params = params.set('category', category);
    if (difficultyLevel) params = params.set('difficultyLevel', difficultyLevel);
    if (maxTime) params = params.set('maxTime', maxTime.toString());

    return this.http.get<ApiResponse<PaginatedResult<Tutorial>>>(this.apiUrl, { params });
  }

  /**
   * Solicita el temario íntegro e información descriptiva de un tutorial en concreto.
   * @param {string} tutorialId - Identificador único de la unidad didáctica.
   * @returns {Observable<ApiResponse<Tutorial>>} Datos completos del tutorial.
   */
  getTutorialById(tutorialId: string): Observable<ApiResponse<Tutorial>> {
    return this.http.get<ApiResponse<Tutorial>>(`${this.apiUrl}/${tutorialId}`);
  }

  /* ==========================================================================
     MÓDULO DE ADMINISTRACIÓN (Requiere Rol 'Admin')
     ========================================================================== */

  /**
   * Publica un nuevo recurso educativo en la plataforma.
   * @param {CreateTutorialPayload} payload - Modelo de datos que conforma el tutorial.
   * @returns {Observable<ApiResponse<Tutorial>>} Registro creado en el sistema.
   */
  createTutorial(payload: CreateTutorialPayload): Observable<ApiResponse<Tutorial>> {
    return this.http.post<ApiResponse<Tutorial>>(this.apiUrl, payload);
  }

  /**
   * Efectúa cambios o parches en los metadatos o temario de un tutorial existente.
   * @param {string} tutorialId - Identificador del tutorial a mutar.
   * @param {Partial<CreateTutorialPayload>} payload - Datos a sobrescribir.
   * @returns {Observable<ApiResponse<Tutorial>>} Registro actualizado.
   */
  updateTutorial(
    tutorialId: string,
    payload: Partial<CreateTutorialPayload>,
  ): Observable<ApiResponse<Tutorial>> {
    return this.http.put<ApiResponse<Tutorial>>(`${this.apiUrl}/${tutorialId}`, payload);
  }

  /**
   * Elimina de forma permanente una unidad didáctica del catálogo público.
   * @param {string} tutorialId - Identificador del tutorial a destruir.
   * @returns {Observable<ApiResponse<null>>} Confirmación de borrado.
   */
  deleteTutorial(tutorialId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${tutorialId}`);
  }

  /* ==========================================================================
     MÓDULO DE INTERACCIÓN Y SEGUIMIENTO (Requiere Autenticación)
     ========================================================================== */

  /**
   * Instancia un registro analítico para vincular a un usuario con el inicio de un tutorial.
   * @param {string} tutorialId - Identificador del recurso educativo.
   * @returns {Observable<ApiResponse<StartTutorialResponse>>} Confirmación de vinculación.
   */
  startTutorial(tutorialId: string): Observable<ApiResponse<StartTutorialResponse>> {
    return this.http.post<ApiResponse<StartTutorialResponse>>(
      `${this.apiUrl}/${tutorialId}/start`,
      {},
    );
  }

  /**
   * Registra y preserva en el backend el avance iterativo del alumno dentro de la unidad.
   * @param {string} tutorialId - Identificador del tutorial en progreso.
   * @param {number} currentStep - Índice temporal del último bloque completado.
   * @returns {Observable<ApiResponse<TutorialProgress>>} Estado sincronizado del avance.
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
