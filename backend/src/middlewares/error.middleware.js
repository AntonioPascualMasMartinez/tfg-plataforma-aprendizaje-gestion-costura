const logger = require('../config/logger');
const crypto = require('crypto');

/**
 * Middleware Global de Manejo de Errores.
 * Centraliza la captura de excepciones y garantiza el "Contrato de Errores" de la API.
 */
const errorHandler = (err, req, res, next) => {
  // 1. Generar un identificador de trazabilidad único para este fallo
  const traceId = crypto.randomUUID();

  // 2. Establecer valores por defecto (Error interno genérico)
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';
  let details = err.details || null;

  // 3. Normalización de errores específicos de terceros (Mongoose y Joi)
  
  // Errores de Validación (Joi o Mongoose)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Error de validación de datos en la carga útil (Payload).';
    // Extraer detalles legibles si proviene de Mongoose
    if (err.errors) {
      details = Object.values(err.errors).map(e => e.message);
    }
  } 
  // Errores de Duplicidad en MongoDB (ej. email ya registrado)
  else if (err.name === 'MongoServerError' && err.code === 11000) {
    statusCode = 409;
    message = 'Conflicto: Ya existe un registro con esos datos únicos en el sistema.';
    details = Object.keys(err.keyValue); // Indica qué campo causó la duplicidad
  } 
  // Errores de tipado de Mongoose (ej. buscar un ID malformado)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Identificador de recurso malformado.';
    details = `El valor proporcionado no es un ${err.kind} válido.`;
  }

  // 4. Registro (Logging) para observabilidad interna (Winston)
  const logMessage = `[TraceID: ${traceId}] ${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - IP: ${req.ip}`;
  
  if (statusCode >= 500) {
    logger.error(`${logMessage}\n${err.stack}`); // Error del servidor: Log completo
  } else {
    logger.warn(logMessage); // Error del cliente: Warning
  }

  // 5. Construcción de la respuesta estandarizada al cliente
  res.status(statusCode).json({
    code: statusCode,
    message: message,
    // Ocultar detalles sensibles si estamos en producción y es un error 500
    details: (process.env.NODE_ENV === 'production' && statusCode === 500) ? null : details,
    traceId: traceId,
    // Mostrar la traza de ejecución solo en entorno de desarrollo para facilitar la depuración
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;