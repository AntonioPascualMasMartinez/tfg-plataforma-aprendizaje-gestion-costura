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

  // --- RUTAS PÚBLICAS ---
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

  getTutorialById(tutorialId: string): Observable<ApiResponse<Tutorial>> {
    return this.http.get<ApiResponse<Tutorial>>(`${this.apiUrl}/${tutorialId}`);
  }

  // --- RUTAS DE ADMINISTRACIÓN (Rol Admin) ---
  createTutorial(payload: CreateTutorialPayload): Observable<ApiResponse<Tutorial>> {
    return this.http.post<ApiResponse<Tutorial>>(this.apiUrl, payload);
  }

  // NUEVO: Método para actualizar tutorial
  updateTutorial(
    tutorialId: string,
    payload: Partial<CreateTutorialPayload>,
  ): Observable<ApiResponse<Tutorial>> {
    return this.http.put<ApiResponse<Tutorial>>(`${this.apiUrl}/${tutorialId}`, payload);
  }

  // NUEVO: Método para eliminar tutorial
  deleteTutorial(tutorialId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${tutorialId}`);
  }

  // --- RUTAS PRIVADAS (Interacción) ---
  startTutorial(tutorialId: string): Observable<ApiResponse<StartTutorialResponse>> {
    return this.http.post<ApiResponse<StartTutorialResponse>>(
      `${this.apiUrl}/${tutorialId}/start`,
      {},
    );
  }

  updateProgress(
    tutorialId: string,
    currentStep: number,
  ): Observable<ApiResponse<TutorialProgress>> {
    return this.http.put<ApiResponse<TutorialProgress>>(`${this.apiUrl}/${tutorialId}/progress`, {
      currentStep,
    });
  }
}
