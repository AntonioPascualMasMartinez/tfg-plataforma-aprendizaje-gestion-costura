/**
 * @fileoverview Pruebas unitarias para la lógica de gestión y administración de usuarios.
 */
const UserService = require('../../src/modules/users/user.service');
const User = require('../../src/modules/users/user.model');

jest.mock('../../src/modules/users/user.model');

describe('UserService - Pruebas Unitarias', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById()', () => {
    it('Debe retornar el documento del usuario si el ID existe', async () => {
      const mockUser = { _id: '123', displayName: 'Costura Lover' };
      User.findById.mockResolvedValue(mockUser);

      const result = await UserService.getUserById('123');
      expect(result.displayName).toBe('Costura Lover');
      expect(User.findById).toHaveBeenCalledWith('123');
    });

    it('Debe lanzar una excepción HTTP 404 si el usuario no existe', async () => {
      User.findById.mockResolvedValue(null);

      await expect(UserService.getUserById('999')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Usuario no encontrado en el sistema.',
      });
    });
  });

  describe('updateUserProfile()', () => {
    it('Debe actualizar y retornar el perfil correctamente', async () => {
      const mockUpdatedUser = { _id: '123', displayName: 'Nuevo Nombre' };
      User.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

      const result = await UserService.updateUserProfile('123', { displayName: 'Nuevo Nombre' });

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        '123',
        { $set: { displayName: 'Nuevo Nombre' } },
        { new: true, runValidators: true },
      );
      expect(result.displayName).toBe('Nuevo Nombre');
    });
  });

  describe('changeUserRole()', () => {
    it('Debe prevenir que un administrador se cambie el rol a sí mismo (Prevenir autodeclive)', async () => {
      await expect(UserService.changeUserRole('admin_1', 'admin_1', 'User')).rejects.toMatchObject({
        statusCode: 400,
      });

      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });
});
