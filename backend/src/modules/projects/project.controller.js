/**
 * @fileoverview Controlador para la gestión de proyectos de costura.
 */
const ProjectService = require('./project.service');
const ResponseFormatter = require('../../utils/responseFormatter');
const projectValidator = require('./project.validator');
const ApiError = require('../../utils/apiError');

class ProjectController {
  /**
   * Crea un nuevo proyecto vinculado al usuario autenticado.
   */
  static async create(req, res, next) {
    try {
      const { error, value } = projectValidator.createProject.validate(req.body, {
        abortEarly: false,
      });
      if (error) {
        throw new ApiError(400, 'Error de validación', true, error.details);
      }

      const project = await ProjectService.createProject(req.user.id, value);
      return ResponseFormatter.success(res, 201, 'Proyecto creado exitosamente', project);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtiene el listado de proyectos públicos para la comunidad.
   */
  static async getPublicFeed(req, res, next) {
    try {
      const { page, limit, search, projectType, sortBy } = req.query;
      const projects = await ProjectService.getPublicProjects(
        page,
        limit,
        search,
        projectType,
        sortBy,
      );
      return ResponseFormatter.success(res, 200, 'Feed de proyectos recuperado', projects);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtiene los detalles completos de un proyecto específico.
   */
  static async getDetails(req, res, next) {
    try {
      const project = await ProjectService.getProjectById(req.params.id);
      return ResponseFormatter.success(res, 200, 'Detalles del proyecto', project);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualiza la información de un proyecto existente.
   */
  static async update(req, res, next) {
    try {
      const { error, value } = projectValidator.updateProject.validate(req.body);
      if (error) {
        throw new ApiError(400, 'Error de validación al actualizar', true, error.details);
      }

      const updatedProject = await ProjectService.updateProject(req.params.id, req.user.id, value);
      return ResponseFormatter.success(res, 200, 'Proyecto actualizado', updatedProject);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Añade un nuevo paso secuencial a un proyecto existente.
   */
  static async addStep(req, res, next) {
    try {
      const { error, value } = projectValidator.addStep.validate(req.body);
      if (error) {
        throw new ApiError(400, 'Error de validación en el paso', true, error.details);
      }

      const updatedProject = await ProjectService.addStepToProject(
        req.params.id,
        req.user.id,
        value,
      );
      return ResponseFormatter.success(res, 201, 'Paso añadido al proyecto', updatedProject);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Elimina un proyecto mediante borrado lógico.
   */
  static async delete(req, res, next) {
    try {
      await ProjectService.deleteProject(req.params.id, req.user.id);
      return ResponseFormatter.success(res, 200, 'Proyecto eliminado correctamente');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtiene el listado de proyectos pertenecientes al usuario autenticado.
   */
  static async getMyProjects(req, res, next) {
    try {
      const { page, limit, status, sortBy, search, projectType } = req.query;
      const projects = await ProjectService.getMyProjects(
        req.user.id,
        page,
        limit,
        status,
        sortBy,
        search,
        projectType,
      );
      return ResponseFormatter.success(res, 200, 'Taller personal recuperado', projects);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProjectController;
