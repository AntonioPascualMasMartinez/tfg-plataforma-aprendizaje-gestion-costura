const Joi = require('joi');

const projectValidator = {
  createProject: Joi.object({
    title: Joi.string().max(100).required(),
    projectType: Joi.string().valid('Nuevo', 'Comenzado desde Tutorial').required(),
    category: Joi.string().required(),
    difficulty: Joi.string().valid('Fácil', 'Intermedio', 'Avanzado').required(),
    inspirationImageUrl: Joi.string().uri().allow('', null).optional(),
    description: Joi.string().allow('', null).optional(),
    status: Joi.string().valid('Planificado', 'En curso', 'Pausado', 'Finalizado').optional(),
    isPublic: Joi.boolean().optional(),
    materials: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          quantity: Joi.string().required(),
        }),
      )
      .optional(),
  }),

  updateProject: Joi.object({
    title: Joi.string().max(100).optional(),
    projectType: Joi.string().valid('Nuevo', 'Comenzado desde Tutorial').optional(),
    category: Joi.string().optional(),
    difficulty: Joi.string().valid('Fácil', 'Intermedio', 'Avanzado').optional(),
    inspirationImageUrl: Joi.string().uri().allow('', null).optional(),
    description: Joi.string().allow('', null).optional(),
    status: Joi.string().valid('Planificado', 'En curso', 'Pausado', 'Finalizado').optional(),
    isPublic: Joi.boolean().optional(),
  }).min(1),

  addStep: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    mediaUrl: Joi.string().uri().allow(null).optional(),
  }),
};

module.exports = projectValidator;
