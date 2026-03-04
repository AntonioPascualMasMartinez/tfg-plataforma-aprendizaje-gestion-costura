const AuthService = require('../../src/modules/auth/auth.service');
const User = require('../../src/modules/users/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 1. Aislar dependencias externas mediante Mocks
jest.mock('../../src/modules/users/user.model');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService - Pruebas Unitarias', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Limpiar contadores y simulaciones tras cada prueba
  });

  describe('registerUser()', () => {
    it('Debe registrar un usuario exitosamente y no devolver la contraseña', async () => {
      // Setup del Mock
      User.findOne.mockResolvedValue(null); // Simula que el email no existe
      bcrypt.hash.mockResolvedValue('hashed_password');
      
      const mockCreatedUser = {
        _id: '123',
        email: 'test@test.com',
        displayName: 'Test User',
        password: 'hashed_password',
        toObject: jest.fn().mockReturnValue({
          _id: '123',
          email: 'test@test.com',
          displayName: 'Test User',
          password: 'hashed_password'
        })
      };
      User.create.mockResolvedValue(mockCreatedUser);

      // Ejecución
      const result = await AuthService.registerUser({
        email: 'test@test.com',
        password: 'password123',
        displayName: 'Test User'
      });

      // Aserciones
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@test.com' });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(User.create).toHaveBeenCalled();
      expect(result.password).toBeUndefined(); // Seguridad: La contraseña debe haber sido eliminada
      expect(result.email).toBe('test@test.com');
    });

    it('Debe lanzar error 409 si el email ya está registrado', async () => {
      User.findOne.mockResolvedValue({ email: 'test@test.com' }); // Simula colisión

      await expect(
        AuthService.registerUser({ email: 'test@test.com', password: '123', displayName: 'Test' })
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('loginUser()', () => {
    it('Debe lanzar error 401 si las credenciales son incorrectas', async () => {
      // Simular cadena de Mongoose: findOne().select()
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null) // Usuario no encontrado
      });

      await expect(
        AuthService.loginUser('wrong@test.com', '1234')
      ).rejects.toMatchObject({ statusCode: 401 });
    });
  });
});