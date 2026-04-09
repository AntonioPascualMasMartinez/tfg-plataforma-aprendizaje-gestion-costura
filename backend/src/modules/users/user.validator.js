/**
 * @fileoverview Esquemas de validación de Joi para el módulo de usuarios.
 */
const Joi = require('joi');

const userValidator = {
  /**
   * Validación para la actualización del perfil propio.
   * Requiere al menos un campo para procesar la petición.
   */
  updateProfile: Joi.object({
    displayName: Joi.string().min(3).max(50).messages({
      'string.min': 'El nombre debe tener un mínimo de 3 caracteres.',
      'string.max': 'El nombre no puede exceder los 50 caracteres.',
    }),
    avatar: Joi.string().uri().allow(null).messages({
      'string.uri': 'El avatar debe ser una URL válida.',
    }),
    sewingLevel: Joi.string().valid('Principiante', 'Intermedio', 'Experto').allow(null),
    interests: Joi.array().items(Joi.string()).allow(null),
  }).min(1),

  /**
   * Validación para el cambio de rol por parte del administrador.
   */
  changeRole: Joi.object({
    role: Joi.string().valid('User', 'Admin').required().messages({
      'any.only': 'El rol debe ser "User" o "Admin".',
      'any.required': 'El rol es obligatorio.',
    }),
  }),

  /**
   * Validación para activar/desactivar (banear) un usuario.
   */
  toggleStatus: Joi.object({
    isActive: Joi.boolean().required().messages({
      'any.required': 'El estado de activación es obligatorio.',
      'boolean.base': 'El estado debe ser un valor booleano (true o false).',
    }),
  }),

  /**
   * Validación para la actualización de contraseña.
   */
  updatePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'La contraseña actual es obligatoria.',
      'string.empty': 'La contraseña actual no puede estar vacía.',
    }),
    newPassword: Joi.string().min(6).required().messages({
      'string.min': 'La nueva contraseña debe tener al menos 6 caracteres.',
      'any.required': 'La nueva contraseña es obligatoria.',
      'string.empty': 'La nueva contraseña no puede estar vacía.',
    }),
  }),
};

module.exports = userValidator;
