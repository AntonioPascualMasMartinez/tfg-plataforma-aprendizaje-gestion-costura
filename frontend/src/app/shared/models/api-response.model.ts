/**
 * @file api-response.model.ts
 * @description Contrato estándar para las respuestas de la API REST.
 * Utiliza tipado genérico (T) para envolver los datos devueltos por el servidor,
 * asegurando una estructura uniforme que simplifica la validación en el cliente.
 */

export interface ApiResponse<T = any> {
  success?: boolean;
  statusCode?: number;
  message: string;
  data: T;
}