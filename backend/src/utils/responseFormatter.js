const crypto = require('crypto');

/**
 * Clase de utilidad para formatear y estandarizar las respuestas HTTP de la API.
 * Asegura el cumplimiento del "Contrato de Respuestas" definido en la arquitectura.
 */
class ResponseFormatter {
  /**
   * Formatea una respuesta exitosa (Data Object).
   * * @param {Object} res - Objeto de respuesta de Express.
   * @param {number} statusCode - Código HTTP de éxito (ej. 200, 201).
   * @param {string} message - Mensaje descriptivo del resultado.
   * @param {Object|Array} [data=null] - Carga útil de la respuesta (los datos solicitados).
   * @returns {Object} Respuesta JSON enviada al cliente.
   */
  static success(res, statusCode = 200, message = 'Operación procesada con éxito', data = null) {
    const responseBody = {
      code: statusCode,
      message: message,
    };

    // Solo adjuntamos el nodo 'data' si se proporcionó información real
    if (data !== null && data !== undefined) {
      responseBody.data = data;
    }

    return res.status(statusCode).json(responseBody);
  }

  /**
   * Formatea una respuesta de error controlado (Error Object).
   * Nota: Generalmente el `error.middleware.js` manejará esto, pero este método
   * es útil para rechazos manuales directos desde los controladores si es necesario.
   * * @param {Object} res - Objeto de respuesta de Express.
   * @param {number} statusCode - Código HTTP de error (ej. 400, 401, 403, 404).
   * @param {string} message - Mensaje general del error.
   * @param {Object|Array|string} [details=null] - Detalles específicos (ej. array de campos inválidos).
   * @param {string} [traceId=null] - ID de seguimiento. Si no se pasa, se genera uno nuevo.
   * @returns {Object} Respuesta JSON enviada al cliente.
   */
  static error(res, statusCode = 500, message = 'Error interno del servidor', details = null, traceId = null) {
    const responseBody = {
      code: statusCode,
      message: message,
      traceId: traceId || crypto.randomUUID(),
    };

    // Solo adjuntamos detalles si existen y no estamos ocultando información crítica en producción
    if (details !== null && details !== undefined) {
      // Prevención de fuga de información: Evitar exponer stacks en producción
      if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        responseBody.details = 'Detalles ocultos por seguridad.';
      } else {
        responseBody.details = details;
      }
    }

    return res.status(statusCode).json(responseBody);
  }
}

module.exports = ResponseFormatter;