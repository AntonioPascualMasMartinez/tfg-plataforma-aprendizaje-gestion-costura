import { User } from './user.model';

export type ProjectStatus = 'Planificado' | 'En curso' | 'Pausado' | 'Finalizado';
export type ProjectType = 'Nuevo' | 'Comenzado desde Tutorial';
export type ProjectDifficulty = 'Fácil' | 'Intermedio' | 'Avanzado';

export interface ProjectMaterial {
  _id?: string;
  name: string;
  quantity: string;
  isAcquired: boolean;
}

export interface ProjectStep {
  _id?: string;
  order: number;
  title: string;
  description: string;
  mediaUrl: string | null;
}

export interface Project {
  _id: string;
  ownerId: string | Partial<User>;
  title: string;
  projectType: ProjectType;
  category: string;
  difficulty: ProjectDifficulty;
  inspirationImageUrl: string | null;
  description: string;
  status: ProjectStatus;
  isPublic: boolean;
  materials: ProjectMaterial[];
  steps: ProjectStep[];
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  title: string;
  projectType: ProjectType;
  category: string;
  difficulty: ProjectDifficulty;
  inspirationImageUrl?: string | null;
  description?: string;
  status?: ProjectStatus;
  isPublic?: boolean;
  materials?: Omit<ProjectMaterial, '_id' | 'isAcquired'>[];
}

export type UpdateProjectPayload = Partial<CreateProjectPayload>;

export interface AddStepPayload {
  title: string;
  description: string;
  mediaUrl?: string | null;
}
