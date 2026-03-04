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
   * Operación ATÓMICA: Incrementa los "Me gusta" directamente en la DB.
   * Evita que dos usuarios dando like al mismo tiempo sobreescriban el valor del otro.
   */
  static async incrementProjectLikes(projectId) {
    // findByIdAndUpdate con $inc delega la suma al motor de MongoDB (C++), garantizando atomicidad
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $inc: { likesCount: 1 } },
      { new: true }, // Retorna el documento ya actualizado
    );

    if (!updatedProject) throw new ApiError(404, 'Proyecto no encontrado.');
    return updatedProject;
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
   * (Admin) Obtiene la cola de moderación.
   */
  static async getModerationQueue(page = 1, limit = 20) {
    return await Report.paginate(
      { status: 'Pending' },
      { page, limit, sort: { createdAt: 1 }, populate: 'reporterId targetId' },
    );
  }
}

module.exports = CommunityService;
