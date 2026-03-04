const rateLimit = require('express-rate-limit');

/**
 * Limitador Genérico: Aplicable a la mayoría de rutas (ej. lectura de proyectos).
 * Límite moderado para prevenir abusos (Scraping o DoS).
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Ventana de 15 minutos
  max: 10000, // Máximo 100 peticiones por IP en esa ventana
  standardHeaders: true, // Retorna la info del límite en las cabeceras `RateLimit-*`
  legacyHeaders: false, // Deshabilita cabeceras `X-RateLimit-*`
  message: {
    code: 429,
    message: 'Demasiadas peticiones desde esta IP. Por favor, inténtelo de nuevo más tarde.',
  },
});

/**
 * Limitador Estricto: Específico para rutas de autenticación (/login, /register).
 * Mitiga ataques de fuerza bruta contra credenciales.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Ventana de 15 minutos
  max: 50, // Máximo 5 intentos de inicio de sesión por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 429,
    message: 'Demasiados intentos de acceso fallidos. Por seguridad, su IP ha sido bloqueada temporalmente por 15 minutos.',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
};