const Joi = require('joi');

const tutorialValidator = {
  updateProgress: Joi.object({
    currentStep: Joi.number().integer().min(1).required().messages({
      'number.base': 'El paso actual debe ser un número.',
      'any.required': 'Debes especificar el paso que acabas de completar.',
    }),
  }),
};

module.exports = tutorialValidator;
