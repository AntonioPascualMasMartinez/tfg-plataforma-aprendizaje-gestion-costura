/**
 * @fileoverview Pruebas de integración para las rutas del módulo de Subidas (Uploads).
 */
const request = require('supertest');
const app = require('../../src/app');
const jwt = require('jsonwebtoken');
const UploadService = require('../../src/modules/uploads/upload.service');
const User = require('../../src/modules/users/user.model'); // <-- IMPORTADO

jest.mock('../../src/modules/uploads/upload.service');
jest.mock('../../src/modules/users/user.model'); // <-- MOCKEADO

describe('Upload Routes - Pruebas de Integración', () => {
  const generateToken = () =>
    jwt.sign({ id: 'user1', role: 'User' }, process.env.JWT_ACCESS_SECRET || 'secret');

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'secret_test_key';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    User.findById.mockResolvedValue({ _id: 'user1', isActive: true, role: 'User' });
  });

  describe('GET /api/v1/uploads/signature', () => {
    it('Debe rechazar con 401 si no hay token de autenticación', async () => {
      const response = await request(app).get('/api/v1/uploads/signature');

      expect(response.status).toBe(401);
      expect(UploadService.generateSignature).not.toHaveBeenCalled();
    });

    it('Debe retornar 200 y los datos de firma criptográfica para subidas', async () => {
      UploadService.generateSignature.mockReturnValue({
        timestamp: 123456789,
        signature: 'fake_crypto_signature',
        folder: 'costura_projects',
        cloudName: 'test_cloud',
        apiKey: 'test_key',
      });

      const response = await request(app)
        .get('/api/v1/uploads/signature?folder=costura_projects')
        .set('Authorization', `Bearer ${generateToken()}`);

      expect(response.status).toBe(200);
      expect(response.body.data.signature).toBe('fake_crypto_signature');
      expect(UploadService.generateSignature).toHaveBeenCalledWith('costura_projects');
    });
  });
});
