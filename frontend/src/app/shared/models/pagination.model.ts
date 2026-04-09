/**
 * @file pagination.model.ts
 * @description Envoltorio genérico para estructuras de datos paginadas.
 * Facilita la construcción de interfaces de navegación (paginadores, scroll infinito)
 * exponiendo los metadatos de los cursores de la base de datos.
 */

export interface PaginatedResult<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}
