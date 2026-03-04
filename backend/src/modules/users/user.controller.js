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
}

module.exports = UserController;
