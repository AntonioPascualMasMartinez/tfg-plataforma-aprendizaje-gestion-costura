const request = require('supertest');
const app = require('../../src/app');
const jwt = require('jsonwebtoken');
const TutorialService = require('../../src/modules/tutorials/tutorial.service');

jest.mock('../../src/modules/tutorials/tutorial.service');

describe('Tutorial Routes - Pruebas de Integración', () => {
  const generateToken = () =>
    jwt.sign({ id: 'user1', role: 'User' }, process.env.JWT_ACCESS_SECRET || 'secret');

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'secret_test_key';
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT /api/v1/tutorials/:id/progress', () => {
    it('Debe rechazar con 400 si el payload es inválido (Joi)', async () => {
      const response = await request(app)
        .put('/api/v1/tutorials/tut1/progress')
        .set('Authorization', `Bearer ${generateToken()}`)
        .send({ currentStep: 'texto_invalido' }); // Debe ser número

      expect(response.status).toBe(400);
      expect(TutorialService.updateProgress).not.toHaveBeenCalled();
    });

    it('Debe actualizar el progreso y retornar 200', async () => {
      TutorialService.updateProgress.mockResolvedValue({
        currentStep: 2,
        completionPercentage: 50,
      });

      const response = await request(app)
        .put('/api/v1/tutorials/tut1/progress')
        .set('Authorization', `Bearer ${generateToken()}`)
        .send({ currentStep: 2 });

      expect(response.status).toBe(200);
      expect(response.body.data.completionPercentage).toBe(50);
    });
  });
});
