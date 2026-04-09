/**
 * @fileoverview Pruebas unitarias para la lógica de interacciones sociales y moderación.
 */
const CommunityService = require('../../src/modules/community/community.service');
const Project = require('../../src/modules/projects/project.model');
const Report = require('../../src/modules/community/report.model');

jest.mock('../../src/modules/projects/project.model');
jest.mock('../../src/modules/community/report.model');

describe('CommunityService - Pruebas Unitarias', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('toggleProjectLike()', () => {
    it('Debe añadir el Like si el usuario no había interactuado previamente', async () => {
      const mockProject = {
        _id: 'proj1',
        likes: [], // Array vacío
        save: jest.fn().mockResolvedValue(true),
      };
      Project.findById.mockResolvedValue(mockProject);

      const result = await CommunityService.toggleProjectLike('proj1', 'user1');

      expect(mockProject.likes).toContain('user1');
      expect(result.isLikedByMe).toBe(true);
      expect(result.likesCount).toBe(1);
      expect(mockProject.save).toHaveBeenCalled();
    });

    it('Debe retirar el Like si el usuario ya se encontraba en el array de likes', async () => {
      const mockProject = {
        _id: 'proj1',
        likes: ['user1', 'user2'], // user1 ya existe
        save: jest.fn().mockResolvedValue(true),
      };
      Project.findById.mockResolvedValue(mockProject);

      const result = await CommunityService.toggleProjectLike('proj1', 'user1');

      expect(mockProject.likes).not.toContain('user1'); // Se ha eliminado
      expect(result.isLikedByMe).toBe(false);
      expect(result.likesCount).toBe(1); // Queda 'user2'
    });
  });

  describe('createReport()', () => {
    it('Debe crear un reporte nuevo si no hay duplicados pendientes', async () => {
      Report.findOne.mockResolvedValue(null); // No existe previo
      Report.create.mockResolvedValue({ _id: 'rep1', reason: 'Spam' });

      const result = await CommunityService.createReport('user1', 'Project', 'proj1', 'Spam');

      expect(Report.create).toHaveBeenCalled();
      expect(result).toHaveProperty('_id');
    });

    it('Debe bloquear la creación y lanzar 409 si el usuario ya reportó el mismo contenido (Anti-Spam)', async () => {
      Report.findOne.mockResolvedValue({ _id: 'rep1', status: 'Pending' });

      await expect(
        CommunityService.createReport('user1', 'Project', 'proj1', 'Spam'),
      ).rejects.toMatchObject({
        statusCode: 409,
      });

      expect(Report.create).not.toHaveBeenCalled();
    });
  });
});
