/**
 * @fileoverview Middlewares para la limitación de la tasa de peticiones (Rate Limiting).
 */
const rateLimit = require('express-rate-limit');

/**
 * Limitador general aplicable a la mayoría de las rutas públicas de la API.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 429,
    message: 'Demasiadas peticiones desde esta IP. Por favor, inténtelo de nuevo más tarde.',
  },
});

/**
 * Limitador estricto para rutas sensibles como la autenticación.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 429,
    message: 'Demasiados intentos fallidos. Por seguridad, su IP ha sido bloqueada temporalmente.',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
};
