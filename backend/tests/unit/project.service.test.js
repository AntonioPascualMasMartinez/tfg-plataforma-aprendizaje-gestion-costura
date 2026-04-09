/**
 * @fileoverview Pruebas unitarias para el núcleo de gestión de proyectos textiles.
 */
const ProjectService = require('../../src/modules/projects/project.service');
const Project = require('../../src/modules/projects/project.model');

jest.mock('../../src/modules/projects/project.model');

describe('ProjectService - Pruebas Unitarias', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('_verifyOwnership()', () => {
    it('Debe retornar el proyecto si el usuario solicitante es el propietario legítimo', async () => {
      const mockProject = { _id: 'proj1', ownerId: { toString: () => 'user1' } };
      Project.findById.mockResolvedValue(mockProject);

      const result = await ProjectService._verifyOwnership('proj1', 'user1');
      expect(result).toEqual(mockProject);
    });

    it('Debe lanzar excepción HTTP 403 (Forbidden) en intentos de acceso no autorizados', async () => {
      const mockProject = { _id: 'proj1', ownerId: { toString: () => 'user1' } };
      Project.findById.mockResolvedValue(mockProject);

      await expect(ProjectService._verifyOwnership('proj1', 'user2')).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('Debe lanzar excepción HTTP 404 si el proyecto no existe', async () => {
      Project.findById.mockResolvedValue(null);

      await expect(ProjectService._verifyOwnership('proj999', 'user1')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('deleteProject() - Estrategia de Borrado Lógico', () => {
    it('Debe aplicar soft-delete estampando la fecha en deletedAt sin purgar físicamente', async () => {
      const mockProject = {
        _id: 'proj1',
        ownerId: { toString: () => 'user1' },
        deletedAt: null,
        save: jest.fn().mockResolvedValue(true),
      };
      Project.findById.mockResolvedValue(mockProject);

      await ProjectService.deleteProject('proj1', 'user1');

      // CORRECCIÓN: Comprobamos que el método de borrado físico nunca fue invocado
      expect(Project.deleteOne).not.toHaveBeenCalled();
      expect(mockProject.deletedAt).toBeInstanceOf(Date);
      expect(mockProject.save).toHaveBeenCalled();
    });
  });

  describe('createProject()', () => {
    it('Debe inyectar de forma segura el ownerId al crear un nuevo proyecto', async () => {
      const mockProjectData = { title: 'Mi Camisa' };
      Project.create.mockResolvedValue({ ...mockProjectData, ownerId: 'user1' });

      const result = await ProjectService.createProject('user1', mockProjectData);

      expect(Project.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Mi Camisa', ownerId: 'user1' }),
      );
      expect(result.ownerId).toBe('user1');
    });
  });
});
