/**
 * @file project.service.ts
 * @description Servicio central para la lógica de negocio de los proyectos generados por usuarios.
 * Facilita operaciones CRUD (Creación, Lectura, Actualización, Borrado) e integra
 * parámetros de búsqueda, filtrado y ordenación para los repositorios públicos y privados.
 */
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

  /* ==========================================================================
     CONSULTAS PÚBLICAS
     ========================================================================== */

  /**
   * Recupera el repositorio global de proyectos públicos (Feed principal).
   * Soporta indexación dinámica mediante filtros y términos de búsqueda.
   *
   * @param {number} [page=1] - Índice de la página solicitada.
   * @param {number} [limit=10] - Cantidad máxima de resultados.
   * @param {string} [search=''] - Cadena de texto para la búsqueda por título o descripción.
   * @param {string} [projectType] - Categoría estructural del proyecto.
   * @param {string} [sortBy] - Criterio de ordenación algorítmica.
   * @returns {Observable<ApiResponse<PaginatedResult<Project>>>} Listado de proyectos evaluados.
   */
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

  /**
   * Solicita la información detallada de un proyecto individual, incluyendo sus metadatos.
   * @param {string} id - Identificador único del proyecto.
   * @returns {Observable<ApiResponse<Project>>} Entidad de proyecto solicitada.
   */
  getProjectById(id: string): Observable<ApiResponse<Project>> {
    return this.http.get<ApiResponse<Project>>(`${this.apiUrl}/${id}`);
  }

  /* ==========================================================================
     OPERACIONES DE AUTORÍA (Requieren Autenticación)
     ========================================================================== */

  /**
   * Inicializa y persiste un nuevo proyecto en la plataforma.
   * @param {CreateProjectPayload} data - Especificaciones iniciales del proyecto.
   * @returns {Observable<ApiResponse<Project>>} Proyecto generado.
   */
  createProject(data: CreateProjectPayload): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(this.apiUrl, data);
  }

  /**
   * Modifica los atributos de un proyecto existente propiedad del usuario activo.
   * @param {string} id - Identificador del proyecto.
   * @param {UpdateProjectPayload} data - Nuevos valores a aplicar.
   * @returns {Observable<ApiResponse<Project>>} Proyecto actualizado.
   */
  updateProject(id: string, data: UpdateProjectPayload): Observable<ApiResponse<Project>> {
    return this.http.put<ApiResponse<Project>>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Ejecuta el borrado lógico de un proyecto (Soft Delete) de la base de datos.
   * @param {string} id - Identificador del proyecto a eliminar.
   * @returns {Observable<ApiResponse<null>>} Confirmación de eliminación.
   */
  deleteProject(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Añade una nueva instrucción o fase de desarrollo al pipeline de un proyecto.
   * @param {string} id - Identificador del proyecto matriz.
   * @param {AddStepPayload} stepData - Contenido y recursos multimedia del paso.
   * @returns {Observable<ApiResponse<Project>>} Proyecto actualizado con el nuevo paso.
   */
  addStepToProject(id: string, stepData: AddStepPayload): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(`${this.apiUrl}/${id}/steps`, stepData);
  }

  /**
   * Recupera el catálogo personal de proyectos del usuario autenticado (Dashboard).
   * Incluye soporte para filtrado por estado de visibilidad y progreso.
   *
   * @param {number} [page=1] - Página actual.
   * @param {number} [limit=20] - Elementos por página.
   * @param {string} [status='Todos'] - Estado del proyecto (ej. Borrador, Publicado).
   * @param {string} [sortBy='nuevo'] - Orientación cronológica.
   * @param {string} [search=''] - Término de búsqueda interno.
   * @param {string} [projectType] - Clasificación del proyecto.
   * @param {boolean} [isPublic] - Filtro estricto por visibilidad pública/privada.
   * @returns {Observable<ApiResponse<PaginatedResult<Project>>>} Listado filtrado del usuario.
   */
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
