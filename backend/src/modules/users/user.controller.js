/**
 * @fileoverview Controlador para la gestión de usuarios y perfiles.
 * Intercepta las peticiones HTTP, valida los payloads y delega la lógica de negocio al servicio.
 */
const UserService = require('./user.service');
const ResponseFormatter = require('../../utils/responseFormatter');
const userValidator = require('./user.validator');
const ApiError = require('../../utils/apiError');

class UserController {
  /**
   * Recupera el perfil del usuario actualmente autenticado.
   * @param {Object} req - Objeto de petición Express.
   * @param {Object} res - Objeto de respuesta Express.
   * @param {Function} next - Función callback para manejo de errores.
   */
  static async getMe(req, res, next) {
    try {
      const user = await UserService.getUserById(req.user.id);
      return ResponseFormatter.success(res, 200, 'Perfil recuperado con éxito', user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualiza el perfil del usuario autenticado.
   * @param {Object} req - Objeto de petición Express.
   * @param {Object} res - Objeto de respuesta Express.
   * @param {Function} next - Función callback para manejo de errores.
   */
  static async updateMe(req, res, next) {
    try {
      const { error, value } = userValidator.updateProfile.validate(req.body, {
        abortEarly: false,
      });
      if (error) {
        throw new ApiError(400, 'Error de validación en los datos enviados', true, error.details);
      }

      const updatedUser = await UserService.updateUserProfile(req.user.id, value);

      return ResponseFormatter.success(res, 200, 'Perfil actualizado correctamente', updatedUser);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recupera un listado paginado de todos los usuarios registrados.
   * Requiere privilegios de Administrador.
   * @param {Object} req - Objeto de petición Express.
   * @param {Object} res - Objeto de respuesta Express.
   * @param {Function} next - Función callback para manejo de errores.
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
   * Modifica el rol asignado a un usuario específico.
   * Requiere privilegios de Administrador.
   * @param {Object} req - Objeto de petición Express.
   * @param {Object} res - Objeto de respuesta Express.
   * @param {Function} next - Función callback para manejo de errores.
   */
  static async changeRole(req, res, next) {
    try {
      const { id: targetUserId } = req.params;

      const { error, value } = userValidator.changeRole.validate(req.body);
      if (error) {
        throw new ApiError(400, 'Datos de rol inválidos', true, error.details);
      }

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
   * Actualiza la contraseña del usuario autenticado tras verificar la contraseña vigente.
   * @param {Object} req - Objeto de petición Express.
   * @param {Object} res - Objeto de respuesta Express.
   * @param {Function} next - Función callback para manejo de errores.
   */
  static async updatePassword(req, res, next) {
    try {
      const { error, value } = userValidator.updatePassword.validate(req.body, {
        abortEarly: false,
      });
      if (error) {
        throw new ApiError(400, 'Error de validación en los datos enviados', true, error.details);
      }

      await UserService.updatePassword(req.user.id, value.currentPassword, value.newPassword);

      return ResponseFormatter.success(res, 200, 'Contraseña actualizada con éxito', null);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Elimina permanentemente la cuenta del usuario autenticado.
   * @param {Object} req - Objeto de petición Express.
   * @param {Object} res - Objeto de respuesta Express.
   * @param {Function} next - Función callback para manejo de errores.
   */
  static async deleteMe(req, res, next) {
    try {
      await UserService.deleteUserAccount(req.user.id);
      res.clearCookie('jwt', { httpOnly: true, secure: true, sameSite: 'None' });

      return ResponseFormatter.success(res, 200, 'Cuenta eliminada con éxito', null);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activa o desactiva (banea) la cuenta de un usuario específico.
   * Requiere privilegios de Administrador.
   * @param {Object} req - Objeto de petición Express.
   * @param {Object} res - Objeto de respuesta Express.
   * @param {Function} next - Función callback para manejo de errores.
   */
  static async toggleUserStatus(req, res, next) {
    try {
      const { id: targetUserId } = req.params;

      const { error, value } = userValidator.toggleStatus.validate(req.body);
      if (error) {
        throw new ApiError(400, 'Datos de estado inválidos', true, error.details);
      }

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

  /**
   * Recupera métricas unificadas para el panel de administración.
   * Requiere privilegios de Administrador.
   * @param {Object} req - Objeto de petición Express.
   * @param {Object} res - Objeto de respuesta Express.
   * @param {Function} next - Función callback para manejo de errores.
   */
  static async getDashboardStats(req, res, next) {
    try {
      const stats = await UserService.getDashboardStats();
      return ResponseFormatter.success(res, 200, 'Estadísticas del panel de administración', stats);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
