import { User } from './user.model';

export type ReportTargetType = 'Project' | 'Comment';
export type ReportStatus = 'Reviewed' | 'Dismissed' | 'Pending';

export interface Comment {
  _id: string;
  projectId: string;
  // El backend hace un populate de 'authorId' devolviendo displayName y avatar
  authorId: string | Partial<User>;
  content: string;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
}

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

// Payload para crear un comentario
export interface AddCommentPayload {
  content: string;
}

// Payload para reportar contenido
export interface CreateReportPayload {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
}
