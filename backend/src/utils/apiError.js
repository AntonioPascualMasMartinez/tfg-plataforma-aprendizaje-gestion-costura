/**
 * @fileoverview Clase personalizada para la gestión estructurada de errores en la API.
 */

/**
 * Extensión de la clase Error nativa para incluir códigos de estado HTTP y trazabilidad operativa.
 * @extends Error
 */
class ApiError extends Error {
  /**
   * Construye una nueva instancia de ApiError.
   * @param {number} statusCode - Código de estado HTTP (ej. 400, 404, 500).
   * @param {string} message - Mensaje descriptivo del error.
   * @param {boolean} [isOperational=true] - Distingue entre errores de lógica de negocio (true) y fallos no previstos (false).
   * @param {string} [stack=''] - Traza de ejecución opcional.
   */
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ApiError;
