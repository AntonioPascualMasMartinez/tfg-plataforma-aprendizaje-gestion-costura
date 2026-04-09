/**
 * @fileoverview Pruebas de integración para las rutas del módulo de Comunidad.
 */
const request = require('supertest');
const app = require('../../src/app');
const jwt = require('jsonwebtoken');
const CommunityService = require('../../src/modules/community/community.service');
const User = require('../../src/modules/users/user.model'); // <-- IMPORTADO

jest.mock('../../src/modules/community/community.service');
jest.mock('../../src/modules/users/user.model'); // <-- MOCKEADO

describe('Community Routes - Pruebas de Integración', () => {
  const generateToken = (role = 'User') =>
    jwt.sign({ id: 'user1', role }, process.env.JWT_ACCESS_SECRET || 'secret');

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'secret_test_key';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Simular por defecto que el usuario de la petición existe y está activo
    User.findById.mockResolvedValue({ _id: 'user1', isActive: true, role: 'User' });
  });

  describe('POST /api/v1/community/projects/:projectId/like', () => {
    it('Debe rechazar con 401 si no hay token', async () => {
      const response = await request(app).post('/api/v1/community/projects/proj1/like');

      expect(response.status).toBe(401);
    });

    it('Debe interactuar (dar/quitar like) y devolver el nuevo conteo', async () => {
      CommunityService.toggleProjectLike.mockResolvedValue({
        likesCount: 5,
        isLikedByMe: true,
      });

      const response = await request(app)
        .post('/api/v1/community/projects/proj1/like')
        .set('Authorization', `Bearer ${generateToken()}`);

      expect(response.status).toBe(200);
      expect(response.body.data.likesCount).toBe(5);
      expect(CommunityService.toggleProjectLike).toHaveBeenCalledWith('proj1', 'user1');
    });
  });

  describe('GET /api/v1/community/admin/moderation', () => {
    it('Debe rechazar con 403 si un usuario normal intenta ver la cola de moderación', async () => {
      const response = await request(app)
        .get('/api/v1/community/admin/moderation')
        .set('Authorization', `Bearer ${generateToken('User')}`);

      expect(response.status).toBe(403);
      expect(CommunityService.getModerationQueue).not.toHaveBeenCalled();
    });

    it('Debe permitir el acceso si el usuario es Administrador', async () => {
      // Sobrescribimos el mock para que el middleware valide que es un Admin activo
      User.findById.mockResolvedValue({ _id: 'user1', isActive: true, role: 'Admin' });
      CommunityService.getModerationQueue.mockResolvedValue({ docs: [], totalDocs: 0 });

      const response = await request(app)
        .get('/api/v1/community/admin/moderation')
        .set('Authorization', `Bearer ${generateToken('Admin')}`);

      expect(response.status).toBe(200);
      expect(CommunityService.getModerationQueue).toHaveBeenCalled();
    });
  });
});
