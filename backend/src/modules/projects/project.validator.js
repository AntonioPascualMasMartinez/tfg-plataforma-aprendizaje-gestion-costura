const Joi = require('joi');

const projectValidator = {
  createProject: Joi.object({
    title: Joi.string().max(100).required(),
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
