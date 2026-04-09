/**
 * @fileoverview Clase de utilidad para formatear y estandarizar las respuestas HTTP.
 */
const crypto = require('crypto');

/**
 * Garantiza el cumplimiento del contrato de respuestas de la API.
 */
class ResponseFormatter {
  /**
   * Genera el formato estándar para respuestas exitosas.
   * @param {Object} res - Objeto de respuesta de Express.
   * @param {number} [statusCode=200] - Código HTTP de éxito.
   * @param {string} [message='Operación procesada con éxito'] - Mensaje descriptivo.
   * @param {Object|Array} [data=null] - Carga útil de la respuesta.
   * @returns {Object} Respuesta JSON enviada al cliente.
   */
  static success(res, statusCode = 200, message = 'Operación procesada con éxito', data = null) {
    const responseBody = {
      code: statusCode,
      message: message,
    };

    if (data !== null && data !== undefined) {
      responseBody.data = data;
    }

    return res.status(statusCode).json(responseBody);
  }

  /**
   * Genera el formato estándar para respuestas de error.
   * @param {Object} res - Objeto de respuesta de Express.
   * @param {number} [statusCode=500] - Código HTTP de error.
   * @param {string} [message='Error interno del servidor'] - Mensaje principal del error.
   * @param {Object|Array|string} [details=null] - Detalles adicionales del error.
   * @param {string} [traceId=null] - Identificador único de seguimiento.
   * @returns {Object} Respuesta JSON enviada al cliente.
   */
  static error(
    res,
    statusCode = 500,
    message = 'Error interno del servidor',
    details = null,
    traceId = null,
  ) {
    const responseBody = {
      code: statusCode,
      message: message,
      traceId: traceId || crypto.randomUUID(),
    };

    if (details !== null && details !== undefined) {
      if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
        responseBody.details = 'Detalles ocultos por seguridad del sistema.';
      } else {
        responseBody.details = details;
      }
    }

    return res.status(statusCode).json(responseBody);
  }
}

module.exports = ResponseFormatter;
