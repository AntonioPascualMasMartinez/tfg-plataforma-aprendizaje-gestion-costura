const CommunityService = require('./community.service');
const ResponseFormatter = require('../../utils/responseFormatter');
const communityValidator = require('./community.validator');
const ApiError = require('../../utils/apiError');

class CommunityController {
  static async addComment(req, res, next) {
    try {
      const { error, value } = communityValidator.addComment.validate(req.body);
      if (error) throw new ApiError(400, 'Error de validación', true, error.details);

      const comment = await CommunityService.addComment(
        req.params.projectId,
        req.user.id,
        value.content,
      );
      return ResponseFormatter.success(res, 201, 'Comentario publicado', comment);
    } catch (error) {
      next(error);
    }
  }

  static async getComments(req, res, next) {
    try {
      const { page, limit } = req.query;
      const comments = await CommunityService.getProjectComments(req.params.projectId, page, limit);
      return ResponseFormatter.success(res, 200, 'Comentarios recuperados', comments);
    } catch (error) {
      next(error);
    }
  }

  static async likeProject(req, res, next) {
    try {
      // Ahora pasamos también req.user.id (disponible gracias al middleware authenticate)
      const result = await CommunityService.toggleProjectLike(req.params.projectId, req.user.id);

      return ResponseFormatter.success(res, 200, 'Like actualizado con éxito', {
        likesCount: result.likesCount,
        isLikedByMe: result.isLikedByMe,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createReport(req, res, next) {
    try {
      const { error, value } = communityValidator.createReport.validate(req.body);
      if (error) throw new ApiError(400, 'Error de validación', true, error.details);

      const report = await CommunityService.createReport(
        req.user.id,
        value.targetType,
        value.targetId,
        value.reason,
      );
      return ResponseFormatter.success(
        res,
        201,
        'Contenido reportado. Gracias por avisar.',
        report,
      );
    } catch (error) {
      next(error);
    }
  }

  static async getModerationQueue(req, res, next) {
    try {
      const { page, limit } = req.query;
      const queue = await CommunityService.getModerationQueue(page, limit);
      return ResponseFormatter.success(res, 200, 'Cola de moderación', queue);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CommunityController;
