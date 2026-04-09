/**
 * @fileoverview Pruebas de integración para las rutas del módulo de Usuarios.
 */
const request = require('supertest');
const app = require('../../src/app');
const jwt = require('jsonwebtoken');
const UserService = require('../../src/modules/users/user.service');
const User = require('../../src/modules/users/user.model'); // <-- NUEVO: Importamos el modelo

jest.mock('../../src/modules/users/user.service');
jest.mock('../../src/modules/users/user.model'); // <-- NUEVO: Mockeamos el modelo globalmente

describe('User Routes - Pruebas de Integración', () => {
  const generateToken = (payload) => jwt.sign(payload, process.env.JWT_ACCESS_SECRET || 'secret');

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'secret_test_key';
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

      // <-- NUEVO: Engañamos al middleware para que crea que el usuario existe y está activo
      User.findById.mockResolvedValue({ _id: '123', isActive: true, role: 'User' });

      // Engañamos al servicio para que devuelva el perfil
      UserService.getUserById.mockResolvedValue({ _id: '123', displayName: 'Test User' });

      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.displayName).toBe('Test User');
      expect(UserService.getUserById).toHaveBeenCalledWith('123');
    });
  });

  describe('GET /api/v1/users/admin', () => {
    it('Debe retornar 403 Forbidden si un usuario normal intenta acceder (RBAC)', async () => {
      const normalUserToken = generateToken({ id: '123', role: 'User' });

      // <-- NUEVO: El middleware verifica que existe, y luego el RBAC verifica su rol
      User.findById.mockResolvedValue({ _id: '123', isActive: true, role: 'User' });

      const response = await request(app)
        .get('/api/v1/users/admin')
        .set('Authorization', `Bearer ${normalUserToken}`);

      expect(response.status).toBe(403);
      expect(UserService.getPaginatedUsers).not.toHaveBeenCalled();
    });

    it('Debe permitir acceso y retornar 200 si el rol es Admin', async () => {
      const adminToken = generateToken({ id: '999', role: 'Admin' });

      // <-- NUEVO: Simulamos al administrador activo en la DB para el middleware
      User.findById.mockResolvedValue({ _id: '999', isActive: true, role: 'Admin' });

      UserService.getPaginatedUsers.mockResolvedValue({ docs: [], totalDocs: 0 });

      const response = await request(app)
        .get('/api/v1/users/admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(UserService.getPaginatedUsers).toHaveBeenCalled();
    });
  });
});
