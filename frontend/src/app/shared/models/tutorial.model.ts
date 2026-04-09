/**
 * @file tutorial.model.ts
 * @description Modelos que sustentan el módulo de formación de la plataforma.
 * Define la estructura de las unidades didácticas y las métricas de seguimiento de los alumnos.
 */
import { Project } from './project.model';

export type DifficultyLevel = 'Principiante' | 'Intermedio' | 'Avanzado';
export type ProgressStatus = 'En curso' | 'Completado';

export interface TutorialStep {
  _id?: string;
  order: number;
  title: string;
  description: string;
  mediaUrl: string | null;
}

export interface TutorialMaterial {
  _id?: string;
  name: string;
  quantity: string;
}

/**
 * Entidad principal que encapsula el contenido de una unidad educativa.
 */
export interface Tutorial {
  _id: string;
  title: string;
  description: string;
  difficultyLevel: DifficultyLevel;
  category: string;
  estimatedTime: number;
  steps: TutorialStep[];
  materialsNeeded: TutorialMaterial[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Entidad analítica que persiste el estado de avance de un usuario sobre un tutorial.
 */
export interface TutorialProgress {
  _id: string;
  userId: string;
  tutorialId: string;
  derivedProjectId: string;
  status: ProgressStatus;
  currentStep: number;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO compuesto de respuesta al iniciar un tutorial.
 * Retorna las métricas de progreso junto a la instancia del proyecto clonado en el entorno del usuario.
 */
export interface StartTutorialResponse {
  progress: TutorialProgress;
  clonedProject: Project;
}

/**
 * DTO para la publicación de un nuevo recurso en el catálogo (Uso exclusivo de administradores).
 */
export interface CreateTutorialPayload {
  title: string;
  description: string;
  difficultyLevel?: DifficultyLevel;
  category: string;
  estimatedTime?: number;
  materialsNeeded?: Omit<TutorialMaterial, '_id'>[];
  steps: Omit<TutorialStep, '_id'>[];
}
