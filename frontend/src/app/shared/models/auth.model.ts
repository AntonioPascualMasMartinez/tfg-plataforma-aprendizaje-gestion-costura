/**
 * @file auth.model.ts
 * @description Modelos de datos y Data Transfer Objects (DTOs) asociados
 * a los flujos de autenticación y autorización (Login y Refresh Token).
 */
import { User } from './user.model';

/**
 * Estructura de respuesta tras una autenticación exitosa (Login / Google OAuth).
 */
export interface AuthResponse {
  user: User;
  accessToken: string;
}

/**
 * Estructura de respuesta tras la rotación del token de acceso.
 */
export interface RefreshResponse {
  accessToken: string;
}
