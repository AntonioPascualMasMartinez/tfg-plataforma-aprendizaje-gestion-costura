const ProjectService = require('./project.service');
const ResponseFormatter = require('../../utils/responseFormatter');
const projectValidator = require('./project.validator');
const ApiError = require('../../utils/apiError');

class ProjectController {
  static async create(req, res, next) {
    try {
      const { error, value } = projectValidator.createProject.validate(req.body, {
        abortEarly: false,
      });
      if (error) throw new ApiError(400, 'Error de validación', true, error.details);

      const project = await ProjectService.createProject(req.user.id, value);
      return ResponseFormatter.success(res, 201, 'Proyecto creado exitosamente', project);
    } catch (error) {
      next(error);
    }
  }

  static async getPublicFeed(req, res, next) {
    try {
      const { page, limit, search } = req.query;
      const projects = await ProjectService.getPublicProjects(page, limit, search);
      return ResponseFormatter.success(res, 200, 'Feed de proyectos recuperado', projects);
    } catch (error) {
      next(error);
    }
  }

  static async getDetails(req, res, next) {
    try {
      const project = await ProjectService.getProjectById(req.params.id);
      return ResponseFormatter.success(res, 200, 'Detalles del proyecto', project);
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { error, value } = projectValidator.updateProject.validate(req.body);
      if (error) throw new ApiError(400, 'Error de validación al actualizar', true, error.details);

      const updatedProject = await ProjectService.updateProject(req.params.id, req.user.id, value);
      return ResponseFormatter.success(res, 200, 'Proyecto actualizado', updatedProject);
    } catch (error) {
      next(error);
    }
  }

  static async addStep(req, res, next) {
    try {
      const { error, value } = projectValidator.addStep.validate(req.body);
      if (error) throw new ApiError(400, 'Error de validación en el paso', true, error.details);

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

  static async delete(req, res, next) {
    try {
      await ProjectService.deleteProject(req.params.id, req.user.id);
      return ResponseFormatter.success(res, 200, 'Proyecto eliminado correctamente');
    } catch (error) {
      next(error);
    }
  }

  static async getMyProjects(req, res, next) {
    try {
      const { page, limit, status, sortBy, search } = req.query;
      const projects = await ProjectService.getMyProjects(
        req.user.id,
        page,
        limit,
        status,
        sortBy,
        search,
      );
      return ResponseFormatter.success(res, 200, 'Taller personal recuperado', projects);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProjectController;
