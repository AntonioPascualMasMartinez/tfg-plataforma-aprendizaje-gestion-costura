/**
 * @fileoverview Controlador para la gestión de interacciones sociales y la cola de moderación.
 */
const CommunityService = require('./community.service');
const ResponseFormatter = require('../../utils/responseFormatter');
const communityValidator = require('./community.validator');
const ApiError = require('../../utils/apiError');

class CommunityController {
  /**
   * Publica un nuevo comentario en un proyecto específico.
   */
  static async addComment(req, res, next) {
    try {
      const { error, value } = communityValidator.addComment.validate(req.body);
      if (error) {
        throw new ApiError(400, 'Error de validación en el comentario', true, error.details);
      }

      const comment = await CommunityService.addComment(
        req.params.projectId,
        req.user.id,
        value.content,
      );
      return ResponseFormatter.success(res, 201, 'Comentario publicado exitosamente', comment);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recupera el listado paginado de comentarios de un proyecto.
   */
  static async getComments(req, res, next) {
    try {
      const { page, limit } = req.query;
      const comments = await CommunityService.getProjectComments(req.params.projectId, page, limit);
      return ResponseFormatter.success(res, 200, 'Comentarios recuperados', comments);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Alterna el estado de 'Me gusta' del usuario sobre un proyecto (Toggle).
   */
  static async likeProject(req, res, next) {
    try {
      const result = await CommunityService.toggleProjectLike(req.params.projectId, req.user.id);

      return ResponseFormatter.success(res, 200, 'Interacción actualizada con éxito', {
        likesCount: result.likesCount,
        isLikedByMe: result.isLikedByMe,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crea un nuevo reporte dirigido al equipo de moderación.
   */
  static async createReport(req, res, next) {
    try {
      const { error, value } = communityValidator.createReport.validate(req.body);
      if (error) {
        throw new ApiError(400, 'Error de validación en el reporte', true, error.details);
      }

      const report = await CommunityService.createReport(
        req.user.id,
        value.targetType,
        value.targetId,
        value.reason,
      );

      return ResponseFormatter.success(res, 201, 'Contenido reportado correctamente.', report);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtiene la cola de moderación (Exclusivo para administradores).
   */
  static async getModerationQueue(req, res, next) {
    try {
      const { page, limit, status } = req.query;
      const queue = await CommunityService.getModerationQueue(page, limit, status);
      return ResponseFormatter.success(res, 200, 'Cola de moderación obtenida', queue);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resuelve el estado de un reporte en la cola de moderación (Exclusivo para administradores).
   */
  static async resolveReport(req, res, next) {
    try {
      const { action } = req.body;
      const report = await CommunityService.resolveReport(req.params.id, action);
      return ResponseFormatter.success(res, 200, 'Estado del reporte actualizado', report);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Elimina un comentario infractor de la plataforma (Exclusivo para administradores).
   */
  static async adminDeleteComment(req, res, next) {
    try {
      await CommunityService.deleteCommentAsAdmin(req.params.id);
      return ResponseFormatter.success(
        res,
        200,
        'Comentario eliminado por el equipo de moderación',
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CommunityController;
