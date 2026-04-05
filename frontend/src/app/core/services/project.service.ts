import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { PaginatedResult } from '../../shared/models/pagination.model';
import {
  Project,
  CreateProjectPayload,
  UpdateProjectPayload,
  AddStepPayload,
} from '../../shared/models/project.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private readonly apiUrl = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) {}

  // ==========================================
  // Rutas Públicas
  // ==========================================

  // GET /api/v1/projects (Feed Público paginado y con búsqueda)
  getPublicFeed(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    projectType?: string,
    sortBy?: string,
  ): Observable<ApiResponse<PaginatedResult<Project>>> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    if (search) params = params.set('search', search);
    if (projectType) params = params.set('projectType', projectType);
    if (sortBy) params = params.set('sortBy', sortBy);

    return this.http.get<ApiResponse<PaginatedResult<Project>>>(this.apiUrl, { params });
  }

  // GET /api/v1/projects/:id (Detalles del proyecto)
  getProjectById(id: string): Observable<ApiResponse<Project>> {
    return this.http.get<ApiResponse<Project>>(`${this.apiUrl}/${id}`);
  }

  // ==========================================
  // Rutas Privadas (Requieren Autenticación)
  // Nota: Asumo que usas un HttpInterceptor para adjuntar el JWT en las cabeceras
  // ==========================================

  // POST /api/v1/projects (Crear proyecto)
  createProject(data: CreateProjectPayload): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(this.apiUrl, data);
  }

  // PUT /api/v1/projects/:id (Actualizar proyecto)
  updateProject(id: string, data: UpdateProjectPayload): Observable<ApiResponse<Project>> {
    return this.http.put<ApiResponse<Project>>(`${this.apiUrl}/${id}`, data);
  }

  // DELETE /api/v1/projects/:id (Borrado lógico)
  deleteProject(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }

  // POST /api/v1/projects/:id/steps (Añadir paso a un proyecto)
  addStepToProject(id: string, stepData: AddStepPayload): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(`${this.apiUrl}/${id}/steps`, stepData);
  }

  // GET /api/v1/projects/me
  getMyProjects(
    page: number = 1,
    limit: number = 20,
    status: string = 'Todos',
    sortBy: string = 'nuevo',
    search: string = '',
    projectType?: string,
    isPublic?: boolean,
  ): Observable<ApiResponse<PaginatedResult<Project>>> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    if (status !== 'Todos') params = params.set('status', status);
    if (sortBy) params = params.set('sortBy', sortBy);
    if (search) params = params.set('search', search);
    if (projectType) params = params.set('projectType', projectType);
    if (isPublic !== undefined) params = params.set('isPublic', isPublic.toString());
    return this.http.get<ApiResponse<PaginatedResult<Project>>>(`${this.apiUrl}/me`, { params });
  }
}
