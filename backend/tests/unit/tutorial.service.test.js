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
    it('Debe clonar el tutorial en un proyecto y crear un registro de progreso', async () => {
      const mockTutorial = {
        _id: 'tut1',
        title: 'Bordado Básico',
        description: 'Aprende a bordar',
        materialsNeeded: [],
        steps: [],
      };

      Tutorial.findById.mockResolvedValue(mockTutorial);
      Progress.findOne.mockResolvedValue(null); // No está iniciado
      Project.create.mockResolvedValue({ _id: 'proj_derivado_1' });
      Progress.create.mockResolvedValue({ currentStep: 0 });

      const result = await TutorialService.startTutorial('user1', 'tut1');

      // Validamos la clonación
      expect(Project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: 'user1',
          title: '[Tutorial] Bordado Básico',
          isPublic: false,
        }),
      );

      // Validamos el progreso
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

    it('Debe lanzar error 409 si ya fue iniciado', async () => {
      Tutorial.findById.mockResolvedValue({ _id: 'tut1' });
      Progress.findOne.mockResolvedValue({ _id: 'prog1' }); // Ya existe

      await expect(TutorialService.startTutorial('user1', 'tut1')).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });

  describe('updateProgress()', () => {
    it('Debe calcular el porcentaje correctamente y cambiar el estado a Completado', async () => {
      const mockTutorial = { steps: [{}, {}, {}, {}] }; // 4 pasos en total
      const mockProgress = {
        currentStep: 0,
        completionPercentage: 0,
        status: 'En curso',
        save: jest.fn(),
      };

      Tutorial.findById.mockResolvedValue(mockTutorial);
      Progress.findOne.mockResolvedValue(mockProgress);

      // El usuario completa el paso 4 de 4
      const result = await TutorialService.updateProgress('user1', 'tut1', 4);

      expect(result.completionPercentage).toBe(100);
      expect(result.status).toBe('Completado');
      expect(mockProgress.save).toHaveBeenCalled();
    });

    it('Debe calcular un 50% si completa 2 de 4 pasos', async () => {
      const mockTutorial = { steps: [{}, {}, {}, {}] }; // 4 pasos
      const mockProgress = { save: jest.fn() };

      Tutorial.findById.mockResolvedValue(mockTutorial);
      Progress.findOne.mockResolvedValue(mockProgress);

      const result = await TutorialService.updateProgress('user1', 'tut1', 2);

      expect(result.completionPercentage).toBe(50);
      expect(result.status).not.toBe('Completado');
    });
  });
});
