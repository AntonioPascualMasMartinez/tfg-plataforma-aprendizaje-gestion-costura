/**
 * @fileoverview Pruebas unitarias para aislar y verificar la lógica de negocio de autenticación.
 */
const AuthService = require('../../src/modules/auth/auth.service');
const User = require('../../src/modules/users/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('../../src/modules/users/user.model');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService - Pruebas Unitarias', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser()', () => {
    it('Debe registrar un usuario exitosamente y omitir la contraseña en la respuesta', async () => {
      User.findOne.mockResolvedValue(null);
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

      const result = await AuthService.registerUser({
        email: 'test@test.com',
        password: 'password123',
        displayName: 'Test User'
      });

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@test.com' });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(User.create).toHaveBeenCalled();
      expect(result.password).toBeUndefined(); // Verificación estricta de seguridad
      expect(result.email).toBe('test@test.com');
    });

    it('Debe lanzar una excepción HTTP 409 si el correo ya existe', async () => {
      User.findOne.mockResolvedValue({ email: 'test@test.com' });

      await expect(
        AuthService.registerUser({ email: 'test@test.com', password: '123', displayName: 'Test' })
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('loginUser()', () => {
    it('Debe lanzar una excepción HTTP 401 si las credenciales son incorrectas (Usuario no existe)', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await expect(
        AuthService.loginUser('wrong@test.com', '1234')
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('Debe autenticar correctamente y retornar el par de tokens', async () => {
      const mockUser = {
        _id: '1',
        email: 'ok@test.com',
        role: 'User',
        password: 'hashed_password',
        toObject: jest.fn().mockReturnValue({ _id: '1', email: 'ok@test.com' })
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign
        .mockReturnValueOnce('access_token_mock')
        .mockReturnValueOnce('refresh_token_mock');

      const result = await AuthService.loginUser('ok@test.com', 'password123');

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(result.accessToken).toBe('access_token_mock');
      expect(result.user.password).toBeUndefined();
    });
  });
});