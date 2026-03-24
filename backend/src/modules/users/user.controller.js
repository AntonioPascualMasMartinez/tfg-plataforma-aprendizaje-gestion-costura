const UserService = require('./user.service');
const ResponseFormatter = require('../../utils/responseFormatter');
const userValidator = require('./user.validator');
const ApiError = require('../../utils/apiError');

class UserController {
  /**
   * GET /api/v1/users/me
   * Devuelve el perfil del usuario autenticado.
   */
  static async getMe(req, res, next) {
    try {
      // req.user.id viene del middleware de autenticación (auth.middleware.js)
      const user = await UserService.getUserById(req.user.id);
      return ResponseFormatter.success(res, 200, 'Perfil recuperado con éxito', user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/users/me
   * Actualiza el perfil del usuario autenticado.
   */
  static async updateMe(req, res, next) {
    try {
      // 1. Validar el payload entrante
      const { error, value } = userValidator.updateProfile.validate(req.body, {
        abortEarly: false,
      });
      if (error) {
        throw new ApiError(400, 'Error de validación en los datos enviados', true, error.details);
      }

      // 2. Llamar al servicio
      const updatedUser = await UserService.updateUserProfile(req.user.id, value);

      // 3. Responder
      return ResponseFormatter.success(res, 200, 'Perfil actualizado correctamente', updatedUser);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users/admin
   * Lista todos los usuarios (Solo Administradores).
   */
  static async getAllUsers(req, res, next) {
    try {
      const { page, limit } = req.query;
      const usersData = await UserService.getPaginatedUsers(page, limit);
      return ResponseFormatter.success(res, 200, 'Listado de usuarios recuperado', usersData);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/users/admin/:id/role
   * Cambia el rol de un usuario.
   */
  static async changeRole(req, res, next) {
    try {
      const { id: targetUserId } = req.params;

      const { error, value } = userValidator.changeRole.validate(req.body);
      if (error) throw new ApiError(400, 'Datos de rol inválidos', true, error.details);

      // req.user.id es el ID del administrador que hace la petición
      const updatedUser = await UserService.changeUserRole(req.user.id, targetUserId, value.role);

      return ResponseFormatter.success(
        res,
        200,
        `Rol actualizado a ${value.role} con éxito`,
        updatedUser,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/users/me/password
   * Actualiza la contraseña del usuario autenticado.
   */
  static async updatePassword(req, res, next) {
    try {
      // 1. Validar payload
      const { error, value } = userValidator.updatePassword.validate(req.body, {
        abortEarly: false,
      });
      if (error) {
        throw new ApiError(400, 'Error de validación en los datos enviados', true, error.details);
      }

      // 2. Llamar al servicio
      await UserService.updatePassword(req.user.id, value.currentPassword, value.newPassword);

      // 3. Responder
      return ResponseFormatter.success(res, 200, 'Contraseña actualizada con éxito', null);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/users/me
   * Elimina la cuenta del usuario autenticado.
   */
  static async deleteMe(req, res, next) {
    try {
      await UserService.deleteUserAccount(req.user.id);

      // Opcional: Podrías limpiar la cookie de sesión/refresh token aquí si la usas
      res.clearCookie('jwt', { httpOnly: true, secure: true, sameSite: 'None' }); // Ajusta según tu config de cookies

      return ResponseFormatter.success(res, 200, 'Cuenta eliminada con éxito', null);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/users/admin/:id/status
   * Banea o desbanea a un usuario.
   */
  static async toggleUserStatus(req, res, next) {
    try {
      const { id: targetUserId } = req.params;

      const { error, value } = userValidator.toggleStatus.validate(req.body);
      if (error) throw new ApiError(400, 'Datos de estado inválidos', true, error.details);

      // req.user.id es el ID del administrador que hace la petición
      const updatedUser = await UserService.toggleUserStatus(
        req.user.id,
        targetUserId,
        value.isActive,
      );

      const actionText = value.isActive ? 'desbaneado/activado' : 'baneado/desactivado';

      return ResponseFormatter.success(res, 200, `Usuario ${actionText} con éxito`, updatedUser);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
