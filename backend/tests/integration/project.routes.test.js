const request = require('supertest');
const app = require('../../src/app');
const jwt = require('jsonwebtoken');
const ProjectService = require('../../src/modules/projects/project.service');

jest.mock('../../src/modules/projects/project.service');

describe('Project Routes - Pruebas de Integración', () => {
  const generateToken = (payload) => jwt.sign(payload, process.env.JWT_ACCESS_SECRET || 'secret');

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'secret_test_key';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/projects (Ruta Pública)', () => {
    it('Debe permitir acceder al feed de proyectos sin token de autenticación', async () => {
      ProjectService.getPublicProjects.mockResolvedValue({ docs: [], totalDocs: 0 });

      const response = await request(app).get('/api/v1/projects');

      expect(response.status).toBe(200);
      expect(ProjectService.getPublicProjects).toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/projects (Ruta Privada)', () => {
    it('Debe rechazar la petición con 401 si no hay token (Middleware Auth)', async () => {
      const response = await request(app)
        .post('/api/v1/projects')
        .send({ title: 'Nuevo Proyecto' });

      expect(response.status).toBe(401);
      expect(ProjectService.createProject).not.toHaveBeenCalled();
    });

    it('Debe rechazar la petición con 400 si falta el título (Validación Joi)', async () => {
      const token = generateToken({ id: 'user1', role: 'User' });

      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Proyecto sin título' }); // Falta el título requerido

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/Error de validación/i);
    });

    it('Debe crear el proyecto y retornar 201 si todo es correcto', async () => {
      const token = generateToken({ id: 'user1', role: 'User' });
      const newProject = { _id: 'proj1', title: 'Falda' };

      ProjectService.createProject.mockResolvedValue(newProject);

      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Falda', isPublic: true });

      expect(response.status).toBe(201);
      expect(response.body.data.title).toBe('Falda');
    });
  });

  describe('DELETE /api/v1/projects/:id (Borrado Lógico)', () => {
    it('Debe llamar al servicio de borrado y retornar 200', async () => {
      const token = generateToken({ id: 'user1', role: 'User' });
      ProjectService.deleteProject.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/v1/projects/proj1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(ProjectService.deleteProject).toHaveBeenCalledWith('proj1', 'user1'); // Extrae id de la ruta y user1 del token
    });
  });
});
