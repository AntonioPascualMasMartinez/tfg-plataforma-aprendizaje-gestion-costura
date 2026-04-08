const TutorialService = require('./tutorial.service');
const ResponseFormatter = require('../../utils/responseFormatter');
const tutorialValidator = require('./tutorial.validator');
const ApiError = require('../../utils/apiError');

class TutorialController {
  static async getCatalog(req, res, next) {
    try {
      const { page, limit, category, difficultyLevel, maxTime } = req.query;
      const tutorials = await TutorialService.getCatalog(
        page,
        limit,
        category,
        difficultyLevel,
        maxTime,
      );
      return ResponseFormatter.success(res, 200, 'Catálogo de tutoriales', tutorials);
    } catch (error) {
      next(error);
    }
  }

  static async start(req, res, next) {
    try {
      const result = await TutorialService.startTutorial(req.user.id, req.params.id);
      return ResponseFormatter.success(
        res,
        201,
        'Tutorial iniciado. Proyecto derivado creado.',
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  static async updateProgress(req, res, next) {
    try {
      const { error, value } = tutorialValidator.updateProgress.validate(req.body);
      if (error) throw new ApiError(400, 'Error de validación', true, error.details);

      const progress = await TutorialService.updateProgress(
        req.user.id,
        req.params.id,
        value.currentStep,
      );
      return ResponseFormatter.success(res, 200, 'Progreso actualizado', progress);
    } catch (error) {
      next(error);
    }
  }

  static async getDetails(req, res, next) {
    try {
      const tutorial = await TutorialService.getTutorialById(req.params.id);
      return ResponseFormatter.success(res, 200, 'Detalles del tutorial', tutorial);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/tutorials
   * Crea un nuevo tutorial (Requiere rol Admin)
   */
  static async create(req, res, next) {
    try {
      // 1. Validar el payload entrante
      const { error, value } = tutorialValidator.createTutorial.validate(req.body, {
        abortEarly: false,
      });

      if (error) {
        throw new ApiError(400, 'Error de validación al crear el tutorial', true, error.details);
      }

      // 2. Llamar al servicio
      const newTutorial = await TutorialService.createTutorial(value);

      // 3. Responder
      return ResponseFormatter.success(res, 201, 'Tutorial creado exitosamente', newTutorial);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/tutorials/:id
   * Actualiza un tutorial existente (Requiere rol Admin)
   */
  static async update(req, res, next) {
    try {
      // Nota: Idealmente deberías añadir un validador Joi (ej: tutorialValidator.updateTutorial)
      // para asegurar que req.body es correcto antes de pasarlo al servicio.
      const updatedTutorial = await TutorialService.updateTutorial(req.params.id, req.body);
      return ResponseFormatter.success(
        res,
        200,
        'Tutorial actualizado exitosamente',
        updatedTutorial,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/tutorials/:id
   * Elimina un tutorial maestro (Requiere rol Admin)
   */
  static async delete(req, res, next) {
    try {
      await TutorialService.deleteTutorial(req.params.id);
      return ResponseFormatter.success(res, 200, 'Tutorial eliminado correctamente', null);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TutorialController;
