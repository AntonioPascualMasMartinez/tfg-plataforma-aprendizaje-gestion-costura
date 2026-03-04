/**
 * Clase personalizada para la gestión estructurada de errores en la API.
 * Extiende la clase Error nativa de JavaScript.
 */
class ApiError extends Error {
  /**
   * Construye un nuevo ApiError.
   * * @param {number} statusCode - Código de estado HTTP (ej. 400, 404, 500).
   * @param {string} message - Mensaje descriptivo del error.
   * @param {boolean} isOperational - True para errores previstos (lógica de negocio). False para bugs o fallos de infraestructura.
   * @param {string} stack - Traza de ejecución (opcional).
   */
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Si se proporciona un stack trace específico, se asigna.
    // De lo contrario, se captura el stack trace actual omitiendo el constructor de esta clase.
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ApiError;