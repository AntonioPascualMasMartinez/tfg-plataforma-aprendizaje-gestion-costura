/**
 * @fileoverview Pruebas unitarias para la lógica de clonación de tutoriales y cálculo de progreso.
 */
const TutorialService = require('../../src/modules/tutorials/tutorial.service');
const Tutorial = require('../../src/modules/tutorials/tutorial.model');
const Progress = require('../../src/modules/tutorials/progress.model');
const Project = require('../../src/modules/projects/project.model');

jest.mock('../../src/modules/tutorials/tutorial.model');
jest.mock('../../src/modules/tutorials/progress.model');
jest.mock('../../src/modules/projects/project.model');

describe('TutorialService - Pruebas Unitarias', () => {
  afterEach(() => jest.clearAllMocks());

  describe('startTutorial()', () => {
    it('Debe clonar el tutorial maestro en un proyecto personal y crear la traza de progreso', async () => {
      const mockTutorial = {
        _id: 'tut1',
        title: 'Bordado Básico',
        description: 'Aprende a bordar',
        difficultyLevel: 'Principiante',
        materialsNeeded: [],
        steps: [],
      };

      Tutorial.findById.mockResolvedValue(mockTutorial);
      Progress.findOne.mockResolvedValue(null);
      Project.create.mockResolvedValue({ _id: 'proj_derivado_1' });
      Progress.create.mockResolvedValue({ currentStep: 0 });

      const result = await TutorialService.startTutorial('user1', 'tut1');

      expect(Project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: 'user1',
          title: '[Tutorial] Bordado Básico',
          isPublic: false,
          difficulty: 'Fácil',
        }),
      );

      expect(Progress.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          tutorialId: 'tut1',
          derivedProjectId: 'proj_derivado_1',
        }),
      );

      expect(result).toHaveProperty('progress');
      expect(result).toHaveProperty('clonedProject');
    });

    it('Debe lanzar HTTP 409 si el usuario ya tiene un progreso activo para dicho tutorial', async () => {
      Tutorial.findById.mockResolvedValue({ _id: 'tut1' });
      Progress.findOne.mockResolvedValue({ _id: 'prog1' });

      await expect(TutorialService.startTutorial('user1', 'tut1')).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });

  describe('updateProgress()', () => {
    it('Debe calcular un 100% matemático y marcar el status como Completado', async () => {
      const mockTutorial = { steps: [{}, {}, {}, {}] }; // 4 pasos
      const mockProgress = {
        currentStep: 0,
        completionPercentage: 0,
        status: 'En curso',
        save: jest.fn(),
      };

      Tutorial.findById.mockResolvedValue(mockTutorial);
      Progress.findOne.mockResolvedValue(mockProgress);

      const result = await TutorialService.updateProgress('user1', 'tut1', 4);

      expect(result.completionPercentage).toBe(100);
      expect(result.status).toBe('Completado');
      expect(mockProgress.save).toHaveBeenCalled();
    });

    it('Debe lanzar HTTP 400 si el paso enviado excede la longitud real del tutorial', async () => {
      const mockTutorial = { steps: [{}, {}] }; // Solo 2 pasos
      const mockProgress = { currentStep: 0 };

      Tutorial.findById.mockResolvedValue(mockTutorial);
      Progress.findOne.mockResolvedValue(mockProgress);

      await expect(TutorialService.updateProgress('user1', 'tut1', 5)).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });
});
