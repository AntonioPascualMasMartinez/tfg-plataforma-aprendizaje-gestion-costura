const request = require('supertest');
const app = require('../../src/app');
const jwt = require('jsonwebtoken');
const UserService = require('../../src/modules/users/user.service');

jest.mock('../../src/modules/users/user.service');

describe('User Routes - Pruebas de Integración', () => {
  // Helpers para generar tokens falsos para pruebas
  const generateToken = (payload) => jwt.sign(payload, process.env.JWT_ACCESS_SECRET || 'secret');
  
  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'secret_test_key'; // Forzamos un secreto de prueba
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/users/me', () => {
    it('Debe retornar 401 si no se envía el token (Auth Middleware)', async () => {
      const response = await request(app).get('/api/v1/users/me');
      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Acceso denegado/i);
    });

    it('Debe retornar el perfil si el token es válido', async () => {
      const validToken = generateToken({ id: '123', role: 'User' });
      UserService.getUserById.mockResolvedValue({ _id: '123', displayName: 'Test User' });

      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${validToken}`); // Inyectar cabecera

      expect(response.status).toBe(200);
      expect(response.body.data.displayName).toBe('Test User');
    });
  });

  describe('GET /api/v1/users/admin', () => {
    it('Debe retornar 403 Forbidden si un usuario normal intenta acceder (RBAC)', async () => {
      const normalUserToken = generateToken({ id: '123', role: 'User' }); // Rol insuficiente

      const response = await request(app)
        .get('/api/v1/users/admin')
        .set('Authorization', `Bearer ${normalUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/Acceso prohibido/i);
    });

    it('Debe permitir acceso si el rol es Admin', async () => {
      const adminToken = generateToken({ id: '999', role: 'Admin' });
      UserService.getPaginatedUsers.mockResolvedValue({ docs: [], totalDocs: 0 });

      const response = await request(app)
        .get('/api/v1/users/admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(UserService.getPaginatedUsers).toHaveBeenCalled();
    });
  });
});