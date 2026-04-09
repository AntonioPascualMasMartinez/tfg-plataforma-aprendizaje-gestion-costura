/**
 * @file project.model.ts
 * @description Definición de la entidad principal del sistema (Proyecto) y sus sub-recursos.
 * Contiene los enumerados que definen la taxonomía de los proyectos y los DTOs
 * para las operaciones de mutación (Creación/Actualización).
 */
import { User } from './user.model';

export type ProjectStatus = 'Planificado' | 'En curso' | 'Pausado' | 'Finalizado';
export type ProjectType = 'Nuevo' | 'Comenzado desde Tutorial' | 'Adaptado de la Comunidad';
export type ProjectDifficulty = 'Fácil' | 'Intermedio' | 'Avanzado';
export type StepStatus = 'Pendiente' | 'Completado';

/**
 * Sub-documento embebido: Representa un elemento en la lista de materiales.
 */
export interface ProjectMaterial {
  _id?: string;
  name: string;
  quantity: string;
  notes?: string;
  isAcquired: boolean;
}

/**
 * Sub-documento embebido: Representa una fase o instrucción del proyecto.
 */
export interface ProjectStep {
  _id?: string;
  order: number;
  title: string;
  description: string;
  mediaUrl: string | null;
  status: StepStatus;
}

/**
 * Entidad principal que conforma un Proyecto generado por el usuario.
 */
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
  learningNotes: string;
  estimatedTime: number | null;
  actualTime: number | null;
  materials: ProjectMaterial[];
  steps: ProjectStep[];
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  likes?: string[];
  originalProjectId?: string | null;
  clonesCount?: number;
}

/**
 * DTO para la instanciación de un nuevo proyecto.
 */
export interface CreateProjectPayload {
  title: string;
  projectType: ProjectType;
  category: string;
  difficulty: ProjectDifficulty;
  inspirationImageUrl?: string | null;
  description?: string;
  status?: ProjectStatus;
  isPublic?: boolean;
  learningNotes?: string | null;
  estimatedTime?: number | null;
  actualTime?: number | null;
  materials?: Omit<ProjectMaterial, '_id' | 'isAcquired'>[];
  originalProjectId?: string | null;
}

/**
 * DTO para la actualización parcial de un proyecto (Patrón Utility de TypeScript).
 */
export type UpdateProjectPayload = Partial<CreateProjectPayload>;

/**
 * DTO para la adición aislada de un paso en el pipeline de construcción.
 */
export interface AddStepPayload {
  title: string;
  description: string;
  mediaUrl?: string | null;
  status?: StepStatus;
}
