/**
 * @fileoverview Middleware de autenticación para validar tokens JWT y el estado del usuario.
 */
const jwt = require('jsonwebtoken');
const User = require('../modules/users/user.model');

/**
 * Valida el Access Token JWT y verifica que el usuario exista y esté activo.
 * @param {Object} req - Objeto de petición Express.
 * @param {Object} res - Objeto de respuesta Express.
 * @param {Function} next - Función callback para continuar la ejecución.
 * @returns {Promise<void>}
 */

const authenticate = async (req, res, next) => {
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

    const user = await User.findById(decodedPayload.id);

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: 'El usuario asociado a este token ya no existe.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        code: 403,
        message: 'Cuenta suspendida. Contacte con soporte para más información.',
      });
    }

    req.user = decodedPayload;
    next();
  } catch (error) {
    const message =
      error.name === 'TokenExpiredError'
        ? 'El token de acceso ha expirado. Solicite uno nuevo mediante el refresh token.'
        : 'Token de acceso inválido o corrupto.';

    return res.status(401).json({
      code: 401,
      message: message,
      details: error.message,
    });
  }
};

module.exports = authenticate;
