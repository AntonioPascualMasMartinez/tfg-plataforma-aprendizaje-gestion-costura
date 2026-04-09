/**
 * @fileoverview Servicio encargado de la lógica de negocio para los tutoriales, clonación de proyectos y cálculo de progresos.
 */
const Tutorial = require('./tutorial.model');
const Progress = require('./progress.model');
const Project = require('../projects/project.model');
const ApiError = require('../../utils/apiError');

class TutorialService {
  /**
   * Recupera el catálogo de tutoriales disponibles aplicando filtros dinámicos y paginación.
   * @param {number} [page=1] - Página actual.
   * @param {number} [limit=10] - Resultados por página.
   * @param {string} [category] - Filtro de categoría temática.
   * @param {string} [difficultyLevel] - Filtro de dificultad.
   * @param {number} [maxTime] - Tiempo máximo estimado en minutos.
   * @returns {Promise<Object>} Catálogo paginado.
   */
  static async getCatalog(page = 1, limit = 10, category, difficultyLevel, maxTime) {
    const query = {};
    if (category) query.category = category;
    if (difficultyLevel) query.difficultyLevel = difficultyLevel;
    if (maxTime) query.estimatedTime = { $lte: parseInt(maxTime, 10) };

    return await Tutorial.paginate(query, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
    });
  }

  /**
   * Inicia el seguimiento de un tutorial, instanciando un progreso y clonando el contenido en un proyecto personal.
   * @param {string} userId - Identificador del usuario solicitante.
   * @param {string} tutorialId - Identificador del tutorial maestro a iniciar.
   * @returns {Promise<Object>} Objeto que contiene el documento de progreso y el proyecto clonado.
   * @throws {ApiError} Si el tutorial no existe o el usuario ya lo ha iniciado.
   */
  static async startTutorial(userId, tutorialId) {
    const tutorial = await Tutorial.findById(tutorialId);
    if (!tutorial) {
      throw new ApiError(404, 'Tutorial no encontrado en el sistema.');
    }

    const existingProgress = await Progress.findOne({ userId, tutorialId });
    if (existingProgress) {
      throw new ApiError(409, 'Ya dispone de un progreso activo para este tutorial.');
    }

    const difficultyMapping = {
      Principiante: 'Fácil',
      Intermedio: 'Intermedio',
      Avanzado: 'Avanzado',
    };

    const clonedProject = await Project.create({
      ownerId: userId,
      title: `[Tutorial] ${tutorial.title}`,
      description: tutorial.description,
      status: 'En curso',
      isPublic: false,
      category: tutorial.category,
      projectType: 'Comenzado desde Tutorial',
      difficulty: difficultyMapping[tutorial.difficultyLevel] || 'Fácil',
      inspirationImageUrl:
        tutorial.steps
          .slice()
          .reverse()
          .find((s) => s.mediaUrl)?.mediaUrl || null,
      materials: tutorial.materialsNeeded.map((m) => ({
        name: m.name,
        quantity: m.quantity,
        isAcquired: false,
      })),
      steps: tutorial.steps.map((s) => ({
        order: s.order,
        title: s.title,
        description: s.description,
        mediaUrl: s.mediaUrl,
      })),
    });

    const progress = await Progress.create({
      userId,
      tutorialId,
      derivedProjectId: clonedProject._id,
      status: 'En curso',
      currentStep: 0,
      completionPercentage: 0,
    });

    return { progress, clonedProject };
  }

  /**
   * Registra el avance en los pasos del tutorial y calcula dinámicamente el porcentaje de completitud.
   * @param {string} userId - Identificador del usuario.
   * @param {string} tutorialId - Identificador del tutorial maestro.
   * @param {number} currentStep - Índice del último paso completado.
   * @returns {Promise<Object>} Documento de progreso actualizado.
   * @throws {ApiError} Si el paso excede el límite lógico o no existe el seguimiento previo.
   */
  static async updateProgress(userId, tutorialId, currentStep) {
    const tutorial = await Tutorial.findById(tutorialId);
    if (!tutorial) {
      throw new ApiError(404, 'Tutorial maestro no encontrado.');
    }

    const progress = await Progress.findOne({ userId, tutorialId });
    if (!progress) {
      throw new ApiError(404, 'No existe un registro de inicio para este tutorial.');
    }

    const totalSteps = tutorial.steps.length;
    if (currentStep > totalSteps) {
      throw new ApiError(
        400,
        `El progreso enviado excede la longitud del tutorial (${totalSteps} pasos).`,
      );
    }

    const percentage = Math.round((currentStep / totalSteps) * 100);

    progress.currentStep = currentStep;
    progress.completionPercentage = percentage;
    if (percentage === 100) {
      progress.status = 'Completado';
    }

    await progress.save();
    return progress;
  }

  /**
   * Obtiene los detalles de un tutorial específico por su identificador.
   * @param {string} tutorialId - Identificador del tutorial.
   * @returns {Promise<Object>} Documento del tutorial.
   * @throws {ApiError} Si no se encuentra el recurso.
   */
  static async getTutorialById(tutorialId) {
    const tutorial = await Tutorial.findById(tutorialId);
    if (!tutorial) {
      throw new ApiError(404, 'Tutorial no encontrado.');
    }
    return tutorial;
  }

  /**
   * Genera y almacena un nuevo tutorial en la base de datos (Exclusivo para administración).
   * @param {Object} tutorialData - Payload de datos del tutorial.
   * @returns {Promise<Object>} Tutorial generado.
   */
  static async createTutorial(tutorialData) {
    return await Tutorial.create(tutorialData);
  }

  /**
   * Actualiza los datos de un tutorial maestro existente.
   * @param {string} tutorialId - Identificador del tutorial a modificar.
   * @param {Object} updateData - Datos a sobrescribir.
   * @returns {Promise<Object>} Tutorial actualizado.
   * @throws {ApiError} Si no se encuentra el recurso.
   */
  static async updateTutorial(tutorialId, updateData) {
    const tutorial = await Tutorial.findByIdAndUpdate(tutorialId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!tutorial) {
      throw new ApiError(404, 'Tutorial no encontrado.');
    }
    return tutorial;
  }

  /**
   * Elimina de manera irreversible un tutorial maestro del sistema.
   * @param {string} tutorialId - Identificador del tutorial.
   * @returns {Promise<Object>} Documento eliminado.
   * @throws {ApiError} Si no se encuentra el recurso.
   */
  static async deleteTutorial(tutorialId) {
    const tutorial = await Tutorial.findByIdAndDelete(tutorialId);
    if (!tutorial) {
      throw new ApiError(404, 'Tutorial no encontrado.');
    }
    return tutorial;
  }
}

module.exports = TutorialService;
