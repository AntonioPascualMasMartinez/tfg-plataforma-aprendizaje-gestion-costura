const jwt = require('jsonwebtoken');

/**
 * Middleware para validar el Access Token JWT.
 * Bloquea la petición con un 401 si no hay token o es inválido/expirado.
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Comprobar si existe la cabecera y sigue el esquema Bearer
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 401,
        message: 'Acceso denegado. Token de autorización no proporcionado o formato inválido.',
      });
    }

    // 2. Extraer el token
    const token = authHeader.split(' ')[1];

    // 3. Verificar criptográficamente el token (Lanza error si expira o la firma no coincide)
    const decodedPayload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // 4. Inyectar la identidad y el rol en la petición para el uso de los controladores
    req.user = decodedPayload;

    next(); // Ceder el control al siguiente middleware o controlador
  } catch (error) {
    // Distinguir entre token expirado y token malformado
    const message = error.name === 'TokenExpiredError' 
      ? 'El token de acceso ha expirado. Por favor, solicite uno nuevo con su refresh token.' 
      : 'Token de acceso inválido o corrupto.';

    return res.status(401).json({
      code: 401,
      message: message,
      details: error.message
    });
  }
};

module.exports = authenticate;