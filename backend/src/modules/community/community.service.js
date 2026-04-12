/**
 * @fileoverview Servicio que gestiona la lógica de las interacciones sociales, valoraciones y el flujo de reportes/moderación.
 */
const Comment = require('./comment.model');
const Report = require('./report.model');
const Project = require('../projects/project.model');
const ApiError = require('../../utils/apiError');
const logger = require('../../config/logger');

class CommunityService {
  /**
   * Registra un nuevo comentario asociado a un proyecto en la plataforma.
   * @param {string} projectId - Identificador del proyecto.
   * @param {string} authorId - Identificador del autor del comentario.
   * @param {string} content - Contenido en texto del comentario.
   * @returns {Promise<Object>} Documento del comentario generado.
   * @throws {ApiError} Si el proyecto especificado no existe.
   */
  static async addComment(projectId, authorId, content) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, 'El proyecto no existe o ha sido eliminado.');
    }

    return await Comment.create({ projectId, authorId, content });
  }

  /**
   * Obtiene la colección paginada de comentarios de un proyecto, ordenada cronológicamente de forma inversa.
   * @param {string} projectId - Identificador del proyecto.
   * @param {number} [page=1] - Página actual.
   * @param {number} [limit=10] - Resultados por página.
   * @returns {Promise<Object>} Paginación de comentarios.
   */
  static async getProjectComments(projectId, page = 1, limit = 10) {
    return await Comment.paginate(
      { projectId },
      {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 },
        populate: { path: 'authorId', select: 'displayName avatar' },
      },
    );
  }

  /**
   * Modifica el estado de valoración ('Me gusta') de un usuario sobre un proyecto específico.
   * @param {string} projectId - Identificador del proyecto.
   * @param {string} userId - Identificador del usuario solicitante.
   * @returns {Promise<Object>} Objeto con el recuento total de 'likes' actualizado y el estado booleano para el usuario.
   * @throws {ApiError} Si el proyecto no existe.
   */
  static async toggleProjectLike(projectId, userId) {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError(404, 'El proyecto no existe.');
    }

    const likeIndex = project.likes.indexOf(userId);
    let isLiked = false;

    if (likeIndex === -1) {
      project.likes.push(userId);
      isLiked = true;
    } else {
      project.likes.splice(likeIndex, 1);
      isLiked = false;
    }

    await project.save();

    return {
      likesCount: project.likes.length,
      isLikedByMe: isLiked,
    };
  }

  /**
   * Emite un reporte polimórfico dirigido a la cola de moderación.
   * @param {string} reporterId - Identificador del usuario que realiza el reporte.
   * @param {string} targetType - Tipo de entidad reportada ('Project' o 'Comment').
   * @param {string} targetId - Identificador de la entidad reportada.
   * @param {string} reason - Motivo descriptivo del reporte.
   * @returns {Promise<Object>} Documento de reporte creado.
   * @throws {ApiError} Si existe un reporte pendiente idéntico emitido por el mismo usuario.
   */
  static async createReport(reporterId, targetType, targetId, reason) {
    const existingReport = await Report.findOne({
      reporterId,
      targetType,
      targetId,
      status: 'Pending',
    });

    if (existingReport) {
      throw new ApiError(
        409,
        'Ya ha reportado este contenido anteriormente. El equipo lo está evaluando.',
      );
    }

    return await Report.create({ reporterId, targetType, targetId, reason });
  }

  /**
   * Recupera la cola de moderación resolviendo las referencias polimórficas para facilitar su visualización administrativa.
   * @param {number} [page=1] - Página actual.
   * @param {number} [limit=20] - Resultados por página.
   * @param {string} [status='Pending'] - Filtro de estado del reporte ('Pending', 'Reviewed', 'Dismissed').
   * @returns {Promise<Object>} Cola de moderación paginada y enriquecida con metadatos del objetivo.
   */
  static async getModerationQueue(page = 1, limit = 20, status = 'Pending') {
    const result = await Report.paginate(
      { status },
      {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 },
        populate: [
          { path: 'reporterId', select: 'displayName avatar email' },
          { path: 'targetId' },
        ],
      },
    );

    const docs = result.docs.map((report) => {
      const doc = report.toObject();

      if (!doc.targetId) {
        doc.targetContent = '[El contenido reportado ha sido eliminado del sistema]';
        doc.reportedUserId = null;
        return doc;
      }

      if (doc.targetType === 'Comment') {
        doc.reportedUserId = doc.targetId.authorId;
        doc.targetContent = doc.targetId.content;
      } else if (doc.targetType === 'Project') {
        doc.reportedUserId = doc.targetId.ownerId;
        doc.targetContent = `[Proyecto] ${doc.targetId.title} - ${doc.targetId.description || ''}`;
      }

      return doc;
    });

    return { ...result, docs };
  }

  /**
   * Actualiza el estado de resolución de un reporte.
   * @param {string} reportId - Identificador del reporte.
   * @param {string} action - Acción correctiva aplicada ('Dismissed' o 'Reviewed').
   * @returns {Promise<Object>} Documento de reporte actualizado.
   * @throws {ApiError} Si el reporte no existe en la base de datos.
   */
  static async resolveReport(reportId, action) {
    const report = await Report.findByIdAndUpdate(reportId, { status: action }, { new: true });
    if (!report) {
      throw new ApiError(404, 'Reporte de moderación no encontrado.');
    }
    logger.info(`Reporte ${reportId} actualizado a estado ${action}`);
    return report;
  }

  /**
   * Ejecuta la eliminación administrativa (moderación severa) de un comentario.
   * @param {string} commentId - Identificador del comentario a purgar.
   * @returns {Promise<boolean>} Confirmación de eliminación.
   * @throws {ApiError} Si el comentario ya no existe.
   */
  static async deleteCommentAsAdmin(commentId) {
    const deleted = await Comment.findByIdAndDelete(commentId);
    if (!deleted) {
      throw new ApiError(404, 'Comentario no encontrado.');
    }
    logger.info(`Acción Administrativa: Comentario ${commentId} eliminado por administrador ${adminId}`);
    return true;
  }
}

module.exports = CommunityService;
