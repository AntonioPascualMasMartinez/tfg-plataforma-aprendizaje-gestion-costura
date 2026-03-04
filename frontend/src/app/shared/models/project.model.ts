import { User } from './user.model';

// Enum de estados basados en el modelo de Mongoose
export type ProjectStatus = 'Planificado' | 'En curso' | 'Pausado' | 'Finalizado';

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

// Interfaz Principal del Proyecto
export interface Project {
  _id: string;
  // El backend hace un .populate('ownerId', 'displayName avatar'),
  // por lo que ownerId puede ser un string o un objeto parcial de User.
  ownerId: string | Partial<User>;
  title: string;
  description: string;
  status: ProjectStatus;
  isPublic: boolean;
  materials: ProjectMaterial[];
  steps: ProjectStep[];
  deletedAt: string | null; // Refleja el Soft Delete (RNF20, RNF21)
  createdAt: string;
  updatedAt: string;
}

// Payloads para las peticiones de creación y actualización
export interface CreateProjectPayload {
  title: string;
  description?: string;
  status?: ProjectStatus;
  isPublic?: boolean;
  materials?: Omit<ProjectMaterial, '_id' | 'isAcquired'>[];
}

export type UpdateProjectPayload = Partial<CreateProjectPayload>;

// Payload para añadir un paso secuencial
export interface AddStepPayload {
  title: string;
  description: string;
  mediaUrl?: string | null;
}
