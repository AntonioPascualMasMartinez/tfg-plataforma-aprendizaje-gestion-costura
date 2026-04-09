/**
 * @fileoverview Controlador para la visualización, gestión y seguimiento de tutoriales.
 */
const TutorialService = require('./tutorial.service');
const ResponseFormatter = require('../../utils/responseFormatter');
const tutorialValidator = require('./tutorial.validator');
const ApiError = require('../../utils/apiError');

class TutorialController {
  /**
   * Obtiene el catálogo público de tutoriales con opciones de filtrado y paginación.
   */
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
      return ResponseFormatter.success(res, 200, 'Catálogo de tutoriales recuperado', tutorials);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Inicia un tutorial guiado, creando el proyecto derivado y el registro de progreso.
   */
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

  /**
   * Actualiza el paso actual del usuario dentro de un tutorial activo.
   */
  static async updateProgress(req, res, next) {
    try {
      const { error, value } = tutorialValidator.updateProgress.validate(req.body);
      if (error) {
        throw new ApiError(400, 'Error de validación en el progreso', true, error.details);
      }

      const progress = await TutorialService.updateProgress(
        req.user.id,
        req.params.id,
        value.currentStep,
      );
      return ResponseFormatter.success(res, 200, 'Progreso actualizado correctamente', progress);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recupera los detalles completos de un tutorial maestro.
   */
  static async getDetails(req, res, next) {
    try {
      const tutorial = await TutorialService.getTutorialById(req.params.id);
      return ResponseFormatter.success(res, 200, 'Detalles del tutorial', tutorial);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crea un nuevo tutorial en la plataforma (Exclusivo para administradores).
   */
  static async create(req, res, next) {
    try {
      const { error, value } = tutorialValidator.createTutorial.validate(req.body, {
        abortEarly: false,
      });
      if (error) {
        throw new ApiError(400, 'Error de validación al crear el tutorial', true, error.details);
      }

      const newTutorial = await TutorialService.createTutorial(value);
      return ResponseFormatter.success(res, 201, 'Tutorial creado exitosamente', newTutorial);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualiza la información de un tutorial existente (Exclusivo para administradores).
   */
  static async update(req, res, next) {
    try {
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
   * Elimina permanentemente un tutorial maestro de la plataforma (Exclusivo para administradores).
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
