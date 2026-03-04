const request = require('supertest');
const app = require('../../src/app');
const AuthService = require('../../src/modules/auth/auth.service');

// Mockear el servicio para no depender de la DB real en el test de integración HTTP
jest.mock('../../src/modules/auth/auth.service');

describe('Auth Routes - Pruebas de Integración', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('Debe retornar 400 si la validación Joi falla (Ej. email inválido)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: '123', // Demasiado corta
          displayName: 'Tu'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/Error de validación/i);
      expect(AuthService.registerUser).not.toHaveBeenCalled(); // Asegura que no llega al servicio
    });

    it('Debe retornar 201 al registrar correctamente', async () => {
      AuthService.registerUser.mockResolvedValue({ id: '1', email: 'ok@test.com', displayName: 'OK' });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'ok@test.com',
          password: 'password123',
          displayName: 'Test User'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.email).toBe('ok@test.com');
      expect(response.body.code).toBe(201);
    });
  });
});