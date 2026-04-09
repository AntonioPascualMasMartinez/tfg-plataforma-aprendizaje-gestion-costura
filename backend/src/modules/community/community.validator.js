/**
 * @fileoverview Esquemas de validación (Joi) para las peticiones del módulo comunitario.
 */
const Joi = require('joi');

const communityValidator = {
  addComment: Joi.object({
    content: Joi.string().max(1000).required().messages({
      'string.empty': 'El comentario no puede estar vacío.',
      'string.max': 'El comentario no puede exceder los 1000 caracteres.',
    }),
  }),

  createReport: Joi.object({
    targetType: Joi.string().valid('Project', 'Comment').required(),
    targetId: Joi.string().hex().length(24).required().messages({
      'string.length': 'El identificador del objetivo debe ser válido.',
    }),
    reason: Joi.string().max(500).required(),
  }),
};

module.exports = communityValidator;
