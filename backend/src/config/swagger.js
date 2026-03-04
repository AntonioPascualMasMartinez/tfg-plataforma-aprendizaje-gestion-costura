const swaggerJSDoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '🧵 API - Plataforma de Proyectos de Costura',
      version: '1.0.0',
      description:
        'Documentación oficial de la API REST para el Trabajo de Fin de Grado (TFG) en Ingeniería Multimedia. Contiene los endpoints para la gestión de usuarios, proyectos textiles, tutoriales y comunidad.',
      contact: {
        name: 'Soporte Técnico TFG',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Servidor Local (Desarrollo)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Introduce tu Access Token JWT para autenticar las peticiones.',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            code: { type: 'integer', example: 400 },
            message: { type: 'string', example: 'Mensaje de error descriptivo' },
            traceId: { type: 'string', example: 'uuid-v4-ejemplo' },
            details: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    // Aplicar seguridad global por defecto a todas las rutas
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Le indicamos a Swagger dónde buscar la documentación de los endpoints
  apis: ['./src/modules/**/*.routes.js'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

module.exports = swaggerSpec;
