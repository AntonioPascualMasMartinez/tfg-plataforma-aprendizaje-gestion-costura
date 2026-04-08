const Tutorial = require('./tutorial.model');
const Progress = require('./progress.model');
const Project = require('../projects/project.model'); // Requerido para la clonación
const ApiError = require('../../utils/apiError');

class TutorialService {
  /**
   * Obtiene el catálogo de tutoriales disponibles (Paginado).
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
   * RF18: Inicia un tutorial guiado (Lógica de Clonación)
   */
  static async startTutorial(userId, tutorialId) {
    // 1. Verificar si el tutorial existe
    const tutorial = await Tutorial.findById(tutorialId);
    if (!tutorial) throw new ApiError(404, 'Tutorial no encontrado.');

    // 2. Verificar si el usuario ya lo inició
    const existingProgress = await Progress.findOne({ userId, tutorialId });
    if (existingProgress) {
      throw new ApiError(409, 'Ya has iniciado este tutorial previamente.');
    }

    const difficultyMapping = {
      Principiante: 'Fácil',
      Intermedio: 'Intermedio',
      Avanzado: 'Avanzado',
    };

    // 3. Clonar el modelo: Crear un Proyecto derivado en el espacio del usuario
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

    // 4. Instanciar el documento de progreso
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
   * Actualiza el hito de avance y calcula el porcentaje automáticamente.
   */
  static async updateProgress(userId, tutorialId, currentStep) {
    const tutorial = await Tutorial.findById(tutorialId);
    if (!tutorial) throw new ApiError(404, 'Tutorial maestro no encontrado.');

    const progress = await Progress.findOne({ userId, tutorialId });
    if (!progress) throw new ApiError(404, 'No has iniciado este tutorial aún.');

    // Validación de límites lógicos
    const totalSteps = tutorial.steps.length;
    if (currentStep > totalSteps) {
      throw new ApiError(400, `El tutorial solo tiene ${totalSteps} pasos.`);
    }

    // Cálculo matemático del porcentaje (0-100)
    const percentage = Math.round((currentStep / totalSteps) * 100);

    progress.currentStep = currentStep;
    progress.completionPercentage = percentage;
    if (percentage === 100) {
      progress.status = 'Completado';
    }

    await progress.save();
    return progress;
  }

  static async getTutorialById(tutorialId) {
    const tutorial = await Tutorial.findById(tutorialId);
    if (!tutorial) throw new ApiError(404, 'Tutorial no encontrado.');
    return tutorial;
  }

  /**
   * Crea un nuevo tutorial maestro (Solo Administradores)
   */
  static async createTutorial(tutorialData) {
    const newTutorial = await Tutorial.create(tutorialData);
    return newTutorial;
  }

  static async updateTutorial(tutorialId, updateData) {
    const tutorial = await Tutorial.findByIdAndUpdate(tutorialId, updateData, {
      new: true,
      runValidators: true,
    });
    if (!tutorial) throw new ApiError(404, 'Tutorial no encontrado.');
    return tutorial;
  }

  static async deleteTutorial(tutorialId) {
    const tutorial = await Tutorial.findByIdAndDelete(tutorialId);
    if (!tutorial) throw new ApiError(404, 'Tutorial no encontrado.');
    return tutorial;
  }
}

module.exports = TutorialService;
