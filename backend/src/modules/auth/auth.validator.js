/**
 * @fileoverview Esquemas de validación (Joi) para las peticiones del módulo de autenticación.
 */
const Joi = require('joi');

const authValidator = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'El formato del correo electrónico es inválido.',
      'any.required': 'El correo electrónico es obligatorio.',
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'La contraseña debe tener al menos 8 caracteres.',
      'any.required': 'La contraseña es obligatoria.',
    }),
    displayName: Joi.string().min(3).max(50).required().messages({
      'string.min': 'El nombre debe tener un mínimo de 3 caracteres.',
      'any.required': 'El nombre de usuario es obligatorio.',
    }),
    sewingLevel: Joi.string().valid('Principiante', 'Intermedio', 'Experto').optional().messages({
      'any.only': 'El nivel de costura debe ser Principiante, Intermedio o Experto.',
    }),
    interests: Joi.array().items(Joi.string()).optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  recoverPassword: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'El formato del correo electrónico es inválido.',
      'any.required': 'El correo electrónico es obligatorio.',
    }),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(8).required().messages({
      'string.min': 'La nueva contraseña debe tener al menos 8 caracteres.',
      'any.required': 'La contraseña es obligatoria.',
    }),
  }),

  googleAuth: Joi.object({
    idToken: Joi.string().required().messages({
      'any.required': 'El token de autenticación es obligatorio.',
    }),
  }),
};

module.exports = authValidator;
