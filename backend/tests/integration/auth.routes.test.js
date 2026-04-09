/**
 * @fileoverview Pruebas de integración para las rutas del módulo de Autenticación.
 */
const request = require('supertest');
const app = require('../../src/app');
const AuthService = require('../../src/modules/auth/auth.service');

jest.mock('../../src/modules/auth/auth.service');

describe('Auth Routes - Pruebas de Integración', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('Debe retornar 400 si la validación falla (Ej. email inválido)', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: 'not-an-email',
        password: '123',
        displayName: 'Tu',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/Error de validación/i);
      expect(AuthService.registerUser).not.toHaveBeenCalled();
    });

    it('Debe retornar 201 al registrar correctamente', async () => {
      AuthService.registerUser.mockResolvedValue({
        id: '1',
        email: 'ok@test.com',
        displayName: 'Test User',
      });

      const response = await request(app).post('/api/v1/auth/register').send({
        email: 'ok@test.com',
        password: 'password123',
        displayName: 'Test User',
      });

      expect(response.status).toBe(201);
      expect(response.body.data.email).toBe('ok@test.com');
      expect(AuthService.registerUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('Debe retornar 200 y el token de acceso con credenciales válidas', async () => {
      AuthService.loginUser.mockResolvedValue({
        user: { id: '1', email: 'ok@test.com' },
        accessToken: 'fake_access_token',
        refreshToken: 'fake_refresh_token',
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'ok@test.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('accessToken', 'fake_access_token');
      expect(response.headers['set-cookie'][0]).toMatch(/refreshToken=/);
    });
  });
});
