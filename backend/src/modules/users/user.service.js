const User = require('./user.model');
const ApiError = require('../../utils/apiError');
const bcrypt = require('bcrypt');

const Tutorial = require('../tutorials/tutorial.model');
const Report = require('../community/report.model');
const Progress = require('../tutorials/progress.model');

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

  /**
   * Actualiza la contraseña del usuario comprobando la actual.
   */
  static async updatePassword(userId, currentPassword, newPassword) {
    // 1. Buscar al usuario y pedir explícitamente el campo password (que tiene select: false en el modelo)
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new ApiError(404, 'Usuario no encontrado.');
    }

    // 2. Si el usuario no tiene contraseña (ej. se registró con Google y nunca la estableció)
    if (!user.password) {
      throw new ApiError(
        400,
        'Este usuario no tiene una contraseña configurada (cuenta de Google).',
      );
    }

    // 3. Comprobar que la contraseña actual es correcta
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new ApiError(401, 'La contraseña actual es incorrecta.');
    }

    // 4. Hashear la nueva contraseña y guardarla
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();
  }

  /**
   * Elimina la cuenta de un usuario.
   */
  static async deleteUserAccount(userId) {
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      throw new ApiError(404, 'No se pudo eliminar. Usuario no encontrado.');
    }
    return deletedUser;
  }

  /**
   * Cambia el estado de cuenta de un usuario (Banear/Desbanear)
   */
  static async toggleUserStatus(adminId, targetUserId, isActiveStatus) {
    // Regla de negocio: Un admin no debería poder banearse a sí mismo
    if (adminId.toString() === targetUserId.toString()) {
      throw new ApiError(400, 'No puedes banear o desbanear tu propia cuenta.');
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
   * Obtiene todas las estadísticas unificadas para el Dashboard del Admin.
   */
  static async getDashboardStats() {
    // 1. Conteos básicos en paralelo para máxima velocidad
    const [totalUsers, totalTutorials, pendingReports] = await Promise.all([
      User.countDocuments(),
      Tutorial.countDocuments(),
      Report.countDocuments({ status: 'Pending' })
    ]);

    // 2. Gráfica de Crecimiento (Últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // 3. Gráfica de Demografía (Nivel de Costura)
    const demographics = await User.aggregate([
      {
        $group: {
          // Si el campo es null o no existe, lo agrupamos como 'No especificado'
          _id: { $ifNull: ['$sewingLevel', 'No especificado'] },
          count: { $sum: 1 }
        }
      }
    ]);

    // 4. Gráfica de Engagement (Éxito en tutoriales)
    const engagement = await Progress.aggregate([
      {
        $group: {
          _id: '$status', // Agrupa por 'En curso' o 'Completado'
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      counts: { totalUsers, totalTutorials, pendingReports },
      charts: { userGrowth, demographics, engagement }
    };
  }
}

module.exports = UserService;
