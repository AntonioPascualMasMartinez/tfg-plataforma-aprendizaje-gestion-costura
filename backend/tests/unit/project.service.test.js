const ProjectService = require('../../src/modules/projects/project.service');
const Project = require('../../src/modules/projects/project.model');

// Mockear el modelo de Mongoose
jest.mock('../../src/modules/projects/project.model');

describe('ProjectService - Pruebas Unitarias', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('_verifyOwnership()', () => {
    it('Debe devolver el proyecto si el usuario es el propietario', async () => {
      const mockProject = { _id: 'proj1', ownerId: { toString: () => 'user1' } };
      Project.findById.mockResolvedValue(mockProject);

      const result = await ProjectService._verifyOwnership('proj1', 'user1');
      expect(result).toEqual(mockProject);
    });

    it('Debe lanzar error 403 si un usuario distinto intenta modificarlo', async () => {
      const mockProject = { _id: 'proj1', ownerId: { toString: () => 'user1' } };
      Project.findById.mockResolvedValue(mockProject);

      await expect(ProjectService._verifyOwnership('proj1', 'user2')).rejects.toMatchObject({
        statusCode: 403,
        message: 'Acceso denegado. No tienes permisos para modificar este proyecto.',
      });
    });

    it('Debe lanzar error 404 si el proyecto no existe', async () => {
      Project.findById.mockResolvedValue(null);

      await expect(ProjectService._verifyOwnership('proj999', 'user1')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('deleteProject() - Borrado Lógico', () => {
    it('Debe aplicar un soft delete estampando la fecha en deletedAt (RNF20, RNF21)', async () => {
      // Configuramos el mock para que pase la verificación de propiedad y exponga el método save()
      const mockProject = {
        _id: 'proj1',
        ownerId: { toString: () => 'user1' },
        deletedAt: null,
        save: jest.fn().mockResolvedValue(true),
      };
      Project.findById.mockResolvedValue(mockProject);

      await ProjectService.deleteProject('proj1', 'user1');

      // Verificamos que no se llamó a un método de borrado físico destructivo (como deleteOne)
      expect(Project.deleteOne).toBeUndefined(); // deleteOne no debe ser invocado en el servicio

      // Verificamos que se actualizó el campo y se guardó
      expect(mockProject.deletedAt).toBeInstanceOf(Date);
      expect(mockProject.save).toHaveBeenCalled();
    });
  });

  describe('createProject()', () => {
    it('Debe inyectar el ownerId al crear un nuevo proyecto', async () => {
      const mockProjectData = { title: 'Mi Camisa' };
      Project.create.mockResolvedValue({ ...mockProjectData, ownerId: 'user1' });

      const result = await ProjectService.createProject('user1', mockProjectData);

      expect(Project.create).toHaveBeenCalledWith({ title: 'Mi Camisa', ownerId: 'user1' });
      expect(result.ownerId).toBe('user1');
    });
  });
});
