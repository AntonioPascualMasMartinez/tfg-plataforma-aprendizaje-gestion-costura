const jwt = require('jsonwebtoken');
// IMPORTANTE: Ajusta esta ruta a donde tengas tu modelo de usuario
const User = require('../modules/users/user.model');

/**
 * Middleware para validar el Access Token JWT y comprobar si el usuario está activo.
 */
const authenticate = async (req, res, next) => {
  // <-- Añadido async
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 401,
        message: 'Acceso denegado. Token de autorización no proporcionado o formato inválido.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decodedPayload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // NUEVO: Buscar al usuario en la base de datos usando el ID del payload
    // Asegúrate de que tu payload incluye el 'id'. (A veces se guarda como '_id')
    const user = await User.findById(decodedPayload.id);

    // 1. Verificar si el usuario fue eliminado de la base de datos
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: 'El usuario asociado a este token ya no existe.',
      });
    }

    // 2. Verificar si el usuario está baneado
    if (!user.isActive) {
      return res.status(403).json({
        // 403 Forbidden es el código semánticamente correcto para baneos
        code: 403,
        message: 'Tu cuenta ha sido suspendida. Contacta con soporte para más información.',
      });
    }

    req.user = decodedPayload;
    next();
  } catch (error) {
    const message =
      error.name === 'TokenExpiredError'
        ? 'El token de acceso ha expirado. Por favor, solicite uno nuevo con su refresh token.'
        : 'Token de acceso inválido o corrupto.';

    return res.status(401).json({
      code: 401,
      message: message,
      details: error.message,
    });
  }
};

module.exports = authenticate;
