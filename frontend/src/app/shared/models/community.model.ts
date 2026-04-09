/**
 * @file community.model.ts
 * @description Entidades de dominio para la interacción social y el sistema de moderación.
 * Define la estructura de comentarios y reportes, contemplando la resolución
 * de referencias (populate) provenientes de la base de datos no relacional.
 */
import { User } from './user.model';

export type ReportTargetType = 'Project' | 'Comment';
export type ReportStatus = 'Reviewed' | 'Dismissed' | 'Pending';

/**
 * Entidad que representa un comentario de usuario dentro de un proyecto.
 */
export interface Comment {
  _id: string;
  projectId: string;
  /* El tipo admite 'string' (ObjectId crudo) o 'Partial<User>' 
     cuando el backend ejecuta un '.populate()' sobre el campo. */
  authorId: string | Partial<User>;
  content: string;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Entidad que representa una denuncia o reporte de moderación.
 */
export interface Report {
  _id: string;
  reporterId: string | Partial<User>;
  targetType: ReportTargetType;
  targetId: string | any;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  reportedUserId?: string;
  targetContent?: string;
}

/**
 * Carga útil (Payload) para la inserción de un nuevo comentario.
 */
export interface AddCommentPayload {
  content: string;
}

/**
 * Carga útil (Payload) para la generación de un reporte de incidencia.
 */
export interface CreateReportPayload {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
}
