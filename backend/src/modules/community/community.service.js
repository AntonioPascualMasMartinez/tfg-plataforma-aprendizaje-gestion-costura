const Comment = require('./comment.model');
const Report = require('./report.model');
const Project = require('../projects/project.model'); // Para verificar si el proyecto existe
const ApiError = require('../../utils/apiError');

class CommunityService {
  /**
   * Añade un comentario a un proyecto específico.
   */
  static async addComment(projectId, authorId, content) {
    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, 'El proyecto al que intentas comentar no existe.');

    const comment = await Comment.create({ projectId, authorId, content });
    return comment;
  }

  /**
   * Obtiene comentarios paginados de un proyecto.
   */
  static async getProjectComments(projectId, page = 1, limit = 10) {
    return await Comment.paginate(
      { projectId },
      {
        page,
        limit,
        sort: { createdAt: -1 },
        populate: { path: 'authorId', select: 'displayName avatar' },
      },
    );
  }

  /**
   * Alterna (Toggle) el "Me gusta" de un usuario en un proyecto.
   * Si el usuario ya le dio like, se lo quita. Si no, se lo añade.
   */
  static async toggleProjectLike(projectId, userId) {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError(404, 'Proyecto no encontrado.');
    }

    // Comprobamos si el ID del usuario ya existe en el array de likes
    const likeIndex = project.likes.indexOf(userId);
    let isLiked = false;

    if (likeIndex === -1) {
      // No le ha dado like: lo añadimos
      project.likes.push(userId);
      isLiked = true;
    } else {
      // Ya le dio like: lo quitamos
      project.likes.splice(likeIndex, 1);
      isLiked = false;
    }

    // Guardamos el documento actualizado
    await project.save();

    // Devolvemos el conteo exacto y el nuevo estado
    return {
      likesCount: project.likes.length,
      isLikedByMe: isLiked,
    };
  }

  /**
   * Crea un reporte polimórfico en la cola de moderación.
   */
  static async createReport(reporterId, targetType, targetId, reason) {
    // Verificamos que no exista ya un reporte idéntico del mismo usuario (prevención de spam)
    const existingReport = await Report.findOne({
      reporterId,
      targetType,
      targetId,
      status: 'Pending',
    });
    if (existingReport) {
      throw new ApiError(409, 'Ya has reportado este contenido. Nuestro equipo lo está revisando.');
    }

    const report = await Report.create({ reporterId, targetType, targetId, reason });
    return report;
  }

  /**
   * (Admin) Obtiene la cola de moderación filtrada por estado.
   */
  static async getModerationQueue(page = 1, limit = 20, status = 'Pending') {
    // 1. Buscamos y paginamos. Hacemos populate dinámico de targetId
    const result = await Report.paginate(
      { status },
      {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 }, // Ordenamos por más recientes primero
        populate: [
          { path: 'reporterId', select: 'displayName avatar email' },
          { path: 'targetId' }, // Como configuraste refPath en el modelo, Mongoose sabe si traer un Project o Comment
        ],
      },
    );

    // 2. Mapeamos los resultados para inyectar los datos unificados que necesita el frontend
    const docs = result.docs.map((report) => {
      const doc = report.toObject();

      // Si el objetivo ya fue borrado de la base de datos, lo manejamos de forma segura
      if (!doc.targetId) {
        doc.targetContent = '[Contenido eliminado previamente]';
        doc.reportedUserId = null;
        return doc;
      }

      // Extraemos el contenido y el autor dependiendo de si es Comentario o Proyecto
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
   * (Admin) Resuelve un reporte actualizando su estado.
   */
  static async resolveReport(reportId, action) {
    // action puede ser 'Dismissed' (ignorar) o 'Reviewed' (penalizar)
    const report = await Report.findByIdAndUpdate(reportId, { status: action }, { new: true });
    if (!report) throw new ApiError(404, 'Reporte no encontrado');
    return report;
  }

  /**
   * (Admin) Borrado forzado de un comentario (Moderación)
   */
  static async deleteCommentAsAdmin(commentId) {
    const deleted = await Comment.findByIdAndDelete(commentId);
    if (!deleted) throw new ApiError(404, 'Comentario no encontrado');
    return true;
  }
}

module.exports = CommunityService;
