/**
 * @fileoverview Middleware global para la intercepción y estandarización de errores.
 */
const logger = require('../config/logger');
const crypto = require('crypto');

/**
 * Captura y formatea las excepciones de la aplicación, garantizando el contrato de la API.
 * @param {Error} err - Objeto de error capturado.
 * @param {Object} req - Objeto de petición Express.
 * @param {Object} res - Objeto de respuesta Express.
 * @param {Function} next - Función callback de Express.
 */

const errorHandler = (err, req, res, next) => {
  const traceId = crypto.randomUUID();

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';
  let details = err.details || null;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Error de validación de datos en la petición.';
    if (err.errors) {
      details = Object.values(err.errors).map((e) => e.message);
    }
  } else if (err.name === 'MongoServerError' && err.code === 11000) {
    statusCode = 409;
    message = 'Conflicto de duplicidad. Ya existe un registro con esos datos únicos.';
    details = Object.keys(err.keyValue);
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Identificador de recurso malformado.';
    details = `El valor proporcionado no es un ${err.kind} válido.`;
  }

  const logMessage = `[TraceID: ${traceId}] ${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - IP: ${req.ip}`;

  if (statusCode >= 500) {
    logger.error(`${logMessage}\n${err.stack}`);
  } else {
    logger.warn(logMessage);
  }

  res.status(statusCode).json({
    code: statusCode,
    message: message,
    details: process.env.NODE_ENV === 'production' && statusCode === 500 ? null : details,
    traceId: traceId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
