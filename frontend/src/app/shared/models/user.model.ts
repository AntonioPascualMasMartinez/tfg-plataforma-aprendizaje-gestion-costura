/**
 * @file user.model.ts
 * @description Entidades de identidad, perfiles de usuario y agregaciones de telemetría.
 */

export type Role = 'User' | 'Admin';
export type SewingLevel = 'Principiante' | 'Intermedio' | 'Experto';

/**
 * Entidad global del usuario, incluyendo atributos base y metadatos de perfilado opcionales.
 */
export interface User {
  _id: string;
  email: string;
  displayName: string;
  avatar: string | null;
  role: Role;

  /* Atributos de personalización de perfil */
  sewingLevel?: SewingLevel | null;
  interests?: string[];
  googleId?: string | null;

  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

/**
 * DTO para la modificación de datos no críticos del perfil de usuario.
 */
export interface UpdateProfilePayload {
  displayName?: string;
  avatar?: string | null;
  sewingLevel?: SewingLevel | null;
  interests?: string[];
}

/**
 * Estructura de datos agregada proveniente del panel de control del administrador.
 * Soporta la visualización de indicadores de rendimiento clave (KPIs) y series temporales.
 */
export interface DashboardStats {
  counts: {
    totalUsers: number;
    totalTutorials: number;
    pendingReports: number;
  };
  charts: {
    userGrowth: { _id: { month: number; year: number }; count: number }[];
    demographics: { _id: string; count: number }[];
    engagement: { _id: string; count: number }[];
  };
}
