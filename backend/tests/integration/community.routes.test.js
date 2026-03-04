const request = require('supertest');
const app = require('../../src/app');
const jwt = require('jsonwebtoken');
const CommunityService = require('../../src/modules/community/community.service');

jest.mock('../../src/modules/community/community.service');

describe('Community Routes - Pruebas de Integración', () => {
  const generateToken = (role = 'User') =>
    jwt.sign({ id: 'user1', role }, process.env.JWT_ACCESS_SECRET || 'secret');

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'secret_test_key';
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/community/projects/:projectId/like', () => {
    it('Debe rechazar con 401 si no hay token', async () => {
      const response = await request(app).post('/api/v1/community/projects/proj1/like');
      expect(response.status).toBe(401);
    });

    it('Debe incrementar el like y devolver el nuevo conteo', async () => {
      CommunityService.incrementProjectLikes.mockResolvedValue({ likesCount: 10 });

      const response = await request(app)
        .post('/api/v1/community/projects/proj1/like')
        .set('Authorization', `Bearer ${generateToken()}`);

      expect(response.status).toBe(200);
      expect(response.body.data.likesCount).toBe(10);
    });
  });

  describe('GET /api/v1/community/admin/moderation', () => {
    it('Debe rechazar con 403 si un usuario normal intenta ver la cola de moderación', async () => {
      const response = await request(app)
        .get('/api/v1/community/admin/moderation')
        .set('Authorization', `Bearer ${generateToken('User')}`); // Rol 'User' en lugar de 'Admin'

      expect(response.status).toBe(403);
    });

    it('Debe permitir el acceso si el usuario es Administrador', async () => {
      CommunityService.getModerationQueue.mockResolvedValue({ docs: [], totalDocs: 0 });

      const response = await request(app)
        .get('/api/v1/community/admin/moderation')
        .set('Authorization', `Bearer ${generateToken('Admin')}`); // Rol Admin

      expect(response.status).toBe(200);
    });
  });
});
