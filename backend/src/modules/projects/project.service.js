/**
 * @fileoverview Servicio que implementa la lógica de negocio para los proyectos de los usuarios.
 */
const Project = require('./project.model');
const ApiError = require('../../utils/apiError');

class ProjectService {
  /**
   * Verifica la existencia de un proyecto y asegura que el usuario solicitante sea el propietario.
   * @private
   * @param {string} projectId - Identificador del proyecto.
   * @param {string} userId - Identificador del usuario.
   * @returns {Promise<Object>} Documento del proyecto.
   * @throws {ApiError} Si el proyecto no existe o el usuario no es el propietario.
   */
  static async _verifyOwnership(projectId, userId) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, 'Proyecto no encontrado.');
    }

    if (project.ownerId.toString() !== userId.toString()) {
      throw new ApiError(
        403,
        'Acceso denegado. Permisos insuficientes para modificar este proyecto.',
      );
    }

    return project;
  }

  /**
   * Registra un nuevo proyecto en la base de datos.
   * @param {string} userId - Identificador del propietario.
   * @param {Object} projectData - Datos del proyecto.
   * @returns {Promise<Object>} Proyecto creado.
   */
  static async createProject(userId, projectData) {
    const project = await Project.create({
      ...projectData,
      ownerId: userId,
    });

    if (projectData.projectType === 'Adaptado de la Comunidad' && projectData.originalProjectId) {
      try {
        await Project.findByIdAndUpdate(projectData.originalProjectId, {
          $inc: { clonesCount: 1 },
        });
      } catch (error) {
        // Fallo no crítico; no aborta la creación del proyecto derivado.
        console.error(
          `Error al incrementar contador de clones para el proyecto origen ${projectData.originalProjectId}:`,
          error,
        );
      }
    }

    return project;
  }

  /**
   * Recupera un listado paginado de proyectos públicos.
   * @param {number} [page=1] - Página actual.
   * @param {number} [limit=10] - Elementos por página.
   * @param {string} [search=''] - Término de búsqueda.
   * @param {string} [projectType] - Filtro por tipo de proyecto.
   * @param {string} [sortBy='fecha'] - Criterio de ordenación.
   * @returns {Promise<Object>} Resultados paginados.
   */
  static async getPublicProjects(page = 1, limit = 10, search = '', projectType, sortBy = 'fecha') {
    const query = { isPublic: true };

    if (search) query.title = { $regex: search, $options: 'i' };
    if (projectType) query.projectType = projectType;

    const sortOptions = {};
    if (sortBy === 'popularidad') {
      sortOptions.likesCount = -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: sortOptions,
      populate: { path: 'ownerId', select: 'displayName avatar' },
    };

    return await Project.paginate(query, options);
  }

  /**
   * Recupera un proyecto específico por su identificador.
   * @param {string} projectId - Identificador del proyecto.
   * @returns {Promise<Object>} Documento del proyecto.
   * @throws {ApiError} Si no se encuentra.
   */
  static async getProjectById(projectId) {
    const project = await Project.findById(projectId).populate('ownerId', 'displayName avatar');
    if (!project) {
      throw new ApiError(404, 'Proyecto no encontrado.');
    }
    return project;
  }

  /**
   * Modifica los datos de un proyecto verificando propiedad.
   * @param {string} projectId - Identificador del proyecto.
   * @param {string} userId - Identificador del usuario propietario.
   * @param {Object} updateData - Campos a modificar.
   * @returns {Promise<Object>} Proyecto actualizado.
   */
  static async updateProject(projectId, userId, updateData) {
    await this._verifyOwnership(projectId, userId);

    return await Project.findByIdAndUpdate(
      projectId,
      { $set: updateData },
      { new: true, runValidators: true },
    );
  }

  /**
   * Agrega un nuevo paso al final de la secuencia de pasos de un proyecto.
   * @param {string} projectId - Identificador del proyecto.
   * @param {string} userId - Identificador del usuario propietario.
   * @param {Object} stepData - Datos del paso.
   * @returns {Promise<Object>} Proyecto actualizado con el nuevo paso.
   */
  static async addStepToProject(projectId, userId, stepData) {
    const project = await this._verifyOwnership(projectId, userId);

    const newOrder =
      project.steps.length > 0 ? Math.max(...project.steps.map((s) => s.order)) + 1 : 1;

    const newStep = { ...stepData, order: newOrder };
    project.steps.push(newStep);

    await project.save();
    return project;
  }

  /**
   * Implementa el borrado lógico de un proyecto marcándolo con una fecha de eliminación.
   * @param {string} projectId - Identificador del proyecto.
   * @param {string} userId - Identificador del usuario propietario.
   * @returns {Promise<boolean>} Confirmación de borrado.
   */
  static async deleteProject(projectId, userId) {
    const project = await this._verifyOwnership(projectId, userId);

    project.deletedAt = new Date();
    await project.save();

    return true;
  }

  /**
   * Recupera el listado personal de proyectos de un usuario, aplicando filtros y paginación.
   * @param {string} userId - Identificador del usuario propietario.
   * @param {number} [page=1] - Página actual.
   * @param {number} [limit=10] - Elementos por página.
   * @param {string} [status='Todos'] - Filtro de estado del proyecto.
   * @param {string} [sortBy='nuevo'] - Criterio de ordenación.
   * @param {string} [search=''] - Término de búsqueda.
   * @param {string} [projectType] - Filtro por origen del proyecto.
   * @returns {Promise<Object>} Resultados paginados.
   */
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
