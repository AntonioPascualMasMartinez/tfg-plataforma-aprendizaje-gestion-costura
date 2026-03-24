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

export interface Tutorial {
  _id: string;
  title: string;
  description: string;
  difficultyLevel: DifficultyLevel;
  category: string;
  estimatedTime: number; // En minutos
  steps: TutorialStep[];
  materialsNeeded: TutorialMaterial[];
  createdAt: string;
  updatedAt: string;
}

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

// Interfaz para la respuesta específica del endpoint startTutorial
export interface StartTutorialResponse {
  progress: TutorialProgress;
  clonedProject: Project;
}

export interface CreateTutorialPayload {
  title: string;
  description: string;
  difficultyLevel?: DifficultyLevel;
  category: string;
  estimatedTime?: number;
  materialsNeeded?: Omit<TutorialMaterial, '_id'>[];
  steps: Omit<TutorialStep, '_id'>[];
}