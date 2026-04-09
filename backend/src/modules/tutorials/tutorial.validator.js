/**
 * @fileoverview Esquemas de validación (Joi) para el módulo de tutoriales y su progreso.
 */
const Joi = require('joi');

const tutorialValidator = {
  createTutorial: Joi.object({
    title: Joi.string().trim().required().messages({
      'any.required': 'El título es obligatorio.',
      'string.empty': 'El título no puede estar vacío.',
    }),
    description: Joi.string().required().messages({
      'any.required': 'La descripción es obligatoria.',
    }),
    difficultyLevel: Joi.string().valid('Principiante', 'Intermedio', 'Avanzado').optional(),
    category: Joi.string().trim().required().messages({
      'any.required': 'La categoría es obligatoria.',
    }),
    estimatedTime: Joi.number().integer().min(0).optional(),
    materialsNeeded: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          quantity: Joi.string().required(),
        }),
      )
      .optional(),
    steps: Joi.array()
      .items(
        Joi.object({
          order: Joi.number().integer().min(1).required(),
          title: Joi.string().required(),
          description: Joi.string().required(),
          mediaUrl: Joi.string().uri().allow(null, '').optional(),
        }),
      )
      .min(1)
      .required()
      .messages({
        'array.min': 'El tutorial debe tener al menos un paso.',
        'any.required': 'Los pasos del tutorial son obligatorios.',
      }),
  }),

  updateProgress: Joi.object({
    currentStep: Joi.number().integer().min(1).required().messages({
      'number.base': 'El paso actual debe ser un número.',
      'any.required': 'Debe especificar el paso que acaba de completar.',
    }),
  }),
};

module.exports = tutorialValidator;
