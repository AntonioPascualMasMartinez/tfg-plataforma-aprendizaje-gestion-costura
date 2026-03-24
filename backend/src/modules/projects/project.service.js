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

  static async getPublicProjects(page = 1, limit = 10, search = '', projectType, sortBy = 'fecha') {
    const query = { isPublic: true };

    if (search) query.title = { $regex: search, $options: 'i' };
    if (projectType) query.projectType = projectType; // Filtro por tipo

    // Ordenamiento dinámico
    const sortOptions = {};
    if (sortBy === 'popularidad') {
      sortOptions.likesCount = -1;
    } else {
      sortOptions.createdAt = -1; // Por defecto: fecha
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: sortOptions,
      populate: { path: 'ownerId', select: 'displayName avatar' },
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

  /* RNF19: Listar mis proyectos con filtros y paginación */
  static async getMyProjects(
    userId,
    page = 1,
    limit = 10,
    status = 'Todos',
    sortBy = 'nuevo',
    search = '',
    projectType,
  ) {
    const query = { ownerId: userId };

    if (status !== 'Todos') {
      query.status = status;
    }

    if (projectType) {
      query.projectType = projectType;
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const sortOptions = {};
    if (sortBy === 'nombre') {
      sortOptions.title = 1;
    } else {
      sortOptions.createdAt = -1;
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: sortOptions,
    };

    return await Project.paginate(query, options);
  }
}

module.exports = ProjectService;
