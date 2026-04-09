/**
 * @fileoverview Servicio que encapsula la lógica de negocio y las interacciones con la base de datos para los usuarios.
 */
const User = require('./user.model');
const ApiError = require('../../utils/apiError');
const bcrypt = require('bcrypt');

const Tutorial = require('../tutorials/tutorial.model');
const Report = require('../community/report.model');
const Progress = require('../tutorials/progress.model');

class UserService {
  /**
   * Localiza y devuelve un usuario por su identificador único.
   * @param {string} userId - Identificador del usuario.
   * @returns {Promise<Object>} Documento del usuario.
   * @throws {ApiError} Si el usuario no existe.
   */
  static async getUserById(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'Usuario no encontrado en el sistema.');
    }
    return user;
  }

  /**
   * Actualiza la información del perfil de un usuario.
   * @param {string} userId - Identificador del usuario.
   * @param {Object} updateData - Objeto con los datos a actualizar.
   * @returns {Promise<Object>} Documento del usuario actualizado.
   * @throws {ApiError} Si el usuario no existe.
   */
  static async updateUserProfile(userId, updateData) {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedUser) {
      throw new ApiError(404, 'No se pudo actualizar el perfil. Usuario no encontrado.');
    }

    return updatedUser;
  }

  /**
   * Devuelve una colección paginada de todos los usuarios registrados.
   * Omitiendo información sensible (contraseñas).
   * @param {number|string} [page=1] - Número de página.
   * @param {number|string} [limit=10] - Cantidad de resultados por página.
   * @returns {Promise<Object>} Objeto de paginación.
   */
  static async getPaginatedUsers(page = 1, limit = 10) {
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      select: '-password',
    };

    return await User.paginate({}, options);
  }

  /**
   * Modifica el rol de sistema de un usuario. Implementa restricciones para prevenir la auto-degradación de permisos.
   * @param {string} adminId - Identificador del administrador ejecutando la acción.
   * @param {string} targetUserId - Identificador del usuario a modificar.
   * @param {string} newRole - Nuevo rol a asignar ('User' o 'Admin').
   * @returns {Promise<Object>} Documento del usuario actualizado.
   * @throws {ApiError} Si el admin intenta modificar su propio rol o si el usuario no existe.
   */
  static async changeUserRole(adminId, targetUserId, newRole) {
    if (adminId.toString() === targetUserId.toString()) {
      throw new ApiError(400, 'No es posible modificar su propio rol administrativo.');
    }

    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      { $set: { role: newRole } },
      { new: true, runValidators: true, select: '-password' },
    );

    if (!updatedUser) {
      throw new ApiError(404, 'Usuario no encontrado.');
    }

    return updatedUser;
  }

  /**
   * Procesa la actualización de la contraseña del usuario comprobando la validez de la contraseña vigente.
   * @param {string} userId - Identificador del usuario.
   * @param {string} currentPassword - Contraseña actual sin cifrar.
   * @param {string} newPassword - Nueva contraseña sin cifrar.
   * @returns {Promise<void>}
   * @throws {ApiError} Si el usuario no existe, utiliza autenticación externa (ej. Google) o la contraseña actual es incorrecta.
   */
  static async updatePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new ApiError(404, 'Usuario no encontrado.');
    }

    if (!user.password) {
      throw new ApiError(
        400,
        'Este usuario no dispone de una contraseña configurada debido al uso de un proveedor de identidad externo.',
      );
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new ApiError(401, 'La contraseña actual proporcionada es incorrecta.');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();
  }

  /**
   * Elimina un usuario de la base de datos de manera irreversible.
   * @param {string} userId - Identificador del usuario a eliminar.
   * @returns {Promise<Object>} Documento del usuario eliminado.
   * @throws {ApiError} Si el usuario no existe.
   */
  static async deleteUserAccount(userId) {
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      throw new ApiError(404, 'No se pudo procesar la eliminación. Usuario no encontrado.');
    }
    return deletedUser;
  }

  /**
   * Modifica el estado activo de un usuario (activación/desactivación de cuenta). Implementa restricciones para prevenir el autobloqueo.
   * @param {string} adminId - Identificador del administrador ejecutando la acción.
   * @param {string} targetUserId - Identificador del usuario a modificar.
   * @param {boolean} isActiveStatus - Nuevo estado de activación.
   * @returns {Promise<Object>} Documento del usuario actualizado.
   * @throws {ApiError} Si el admin intenta modificar su propio estado o si el usuario no existe.
   */
  static async toggleUserStatus(adminId, targetUserId, isActiveStatus) {
    if (adminId.toString() === targetUserId.toString()) {
      throw new ApiError(400, 'No es posible modificar su propio estado de cuenta.');
    }

    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      { $set: { isActive: isActiveStatus } },
      { new: true, runValidators: true, select: '-password' },
    );

    if (!updatedUser) {
      throw new ApiError(404, 'Usuario no encontrado.');
    }

    return updatedUser;
  }

  /**
   * Calcula y agrupa métricas estadísticas transversales del sistema para su representación visual en el panel de administración.
   * @returns {Promise<Object>} Objeto compuesto por métricas globales y datos procesados para gráficas.
   */
  static async getDashboardStats() {
    const [totalUsers, totalTutorials, pendingReports] = await Promise.all([
      User.countDocuments(),
      Tutorial.countDocuments(),
      Report.countDocuments({ status: 'Pending' }),
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const demographics = await User.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$sewingLevel', 'No especificado'] },
          count: { $sum: 1 },
        },
      },
    ]);

    const engagement = await Progress.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      counts: { totalUsers, totalTutorials, pendingReports },
      charts: { userGrowth, demographics, engagement },
    };
  }
}

module.exports = UserService;
