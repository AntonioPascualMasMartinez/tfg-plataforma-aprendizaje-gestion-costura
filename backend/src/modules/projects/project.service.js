const Project = require('./project.model');
const ApiError = require('../../utils/apiError');

class ProjectService {
  /**
   * Helper privado para verificar la propiedad de un proyecto
   */
  static async _verifyOwnership(projectId, userId) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, 'Proyecto no encontrado.');
    }
    // Comparación estricta de ObjectIds
    if (project.ownerId.toString() !== userId.toString()) {
      throw new ApiError(403, 'Acceso denegado. No tienes permisos para modificar este proyecto.');
    }
    return project;
  }

  static async createProject(userId, projectData) {
    const project = await Project.create({
      ...projectData,
      ownerId: userId,
    });
    return project;
  }

  static async getPublicProjects(page = 1, limit = 10, search = '') {
    const query = { isPublic: true };
    if (search) {
      query.title = { $regex: search, $options: 'i' }; // Búsqueda insensible a mayúsculas
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      populate: { path: 'ownerId', select: 'displayName avatar' }, // Traer datos básicos del creador
    };

    return await Project.paginate(query, options);
  }

  static async getProjectById(projectId) {
    const project = await Project.findById(projectId).populate('ownerId', 'displayName avatar');
    if (!project) throw new ApiError(404, 'Proyecto no encontrado.');
    return project;
  }

  static async updateProject(projectId, userId, updateData) {
    await this._verifyOwnership(projectId, userId);

    return await Project.findByIdAndUpdate(
      projectId,
      { $set: updateData },
      { new: true, runValidators: true },
    );
  }

  static async addStepToProject(projectId, userId, stepData) {
    const project = await this._verifyOwnership(projectId, userId);

    // Calcular el orden automáticamente (al final de la lista)
    const newOrder =
      project.steps.length > 0 ? Math.max(...project.steps.map((s) => s.order)) + 1 : 1;

    const newStep = { ...stepData, order: newOrder };
    project.steps.push(newStep);

    await project.save();
    return project;
  }

  /**
   * Borrado Lógico (RNF20, RNF21)
   */
  static async deleteProject(projectId, userId) {
    const project = await this._verifyOwnership(projectId, userId);

    // En lugar de borrar de la base de datos, estampamos la fecha de eliminación
    project.deletedAt = new Date();
    await project.save();

    return true;
  }
}

module.exports = ProjectService;
