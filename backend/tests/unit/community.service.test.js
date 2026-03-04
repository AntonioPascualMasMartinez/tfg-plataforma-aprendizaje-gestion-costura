const CommunityService = require('../../src/modules/community/community.service');
const Project = require('../../src/modules/projects/project.model');
const Report = require('../../src/modules/community/report.model');

jest.mock('../../src/modules/projects/project.model');
jest.mock('../../src/modules/community/report.model');

describe('CommunityService - Pruebas Unitarias', () => {
  afterEach(() => jest.clearAllMocks());

  describe('incrementProjectLikes()', () => {
    it('Debe utilizar el operador atómico $inc de MongoDB para sumar 1 like', async () => {
      Project.findByIdAndUpdate.mockResolvedValue({ _id: 'proj1', likesCount: 5 });

      const result = await CommunityService.incrementProjectLikes('proj1');

      // Validamos que la actualización atómica esté bien formulada
      expect(Project.findByIdAndUpdate).toHaveBeenCalledWith(
        'proj1',
        { $inc: { likesCount: 1 } },
        { new: true },
      );
      expect(result.likesCount).toBe(5);
    });
  });

  describe('createReport()', () => {
    it('Debe crear un reporte polimórfico si no existe uno previo', async () => {
      Report.findOne.mockResolvedValue(null); // No hay reportes previos
      Report.create.mockResolvedValue({ targetType: 'Comment', reason: 'Spam' });

      const result = await CommunityService.createReport('user1', 'Comment', 'com1', 'Spam');

      expect(Report.create).toHaveBeenCalledWith({
        reporterId: 'user1',
        targetType: 'Comment',
        targetId: 'com1',
        reason: 'Spam',
      });
      expect(result.reason).toBe('Spam');
    });

    it('Debe lanzar error 409 si el usuario ya reportó este contenido y está pendiente', async () => {
      Report.findOne.mockResolvedValue({ _id: 'rep1', status: 'Pending' });

      await expect(
        CommunityService.createReport('user1', 'Project', 'proj1', 'Contenido inapropiado'),
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });
});
