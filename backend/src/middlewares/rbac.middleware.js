/**
 * Middleware de Control de Acceso Basado en Roles (RBAC).
 * @param {...String} allowedRoles - Lista de roles permitidos (ej. 'Admin', 'User').
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // 1. Verificación de seguridad: Asegurar que el middleware de auth ya se ejecutó
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        code: 401,
        message: 'Error de identidad. No se pudo verificar el rol del usuario.',
      });
    }

    // 2. Comprobar si el rol del usuario está dentro de la matriz de roles permitidos
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        code: 403,
        message: 'Acceso prohibido (Forbidden). Permisos insuficientes para realizar esta acción.',
        details: `Rol actual: ${req.user.role}, Roles requeridos: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

module.exports = authorizeRoles;