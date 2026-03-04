const User = require('./user.model');
const ApiError = require('../../utils/apiError');

class UserService {
  /**
   * Obtiene un usuario por su ID.
   */
  static async getUserById(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'Usuario no encontrado en el sistema.');
    }
    return user;
  }

  /**
   * Actualiza los datos permitidos del perfil de un usuario.
   */
  static async updateUserProfile(userId, updateData) {
    // findByIdAndUpdate devuelve el documento actualizado gracias a { new: true }
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedUser) {
      throw new ApiError(404, 'No se pudo actualizar. Usuario no encontrado.');
    }

    return updatedUser;
  }

  /**
   * Obtiene una lista paginada de usuarios (Uso administrativo).
   */
  static async getPaginatedUsers(page = 1, limit = 10) {
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 }, // Los más recientes primero
      select: '-password', // Doble seguridad para no devolver passwords
    };

    const result = await User.paginate({}, options);
    return result;
  }

  /**
   * Cambia el rol de un usuario (RF7 - Uso administrativo)
   */
  static async changeUserRole(adminId, targetUserId, newRole) {
    // Regla de negocio: Un admin no debería poder quitarse su propio rol de admin por error
    if (adminId.toString() === targetUserId.toString()) {
      throw new ApiError(400, 'No puedes modificar tu propio rol administrativo.');
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
}

module.exports = UserService;
