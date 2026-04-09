/**
 * @fileoverview Middleware para el Control de Acceso Basado en Roles (RBAC).
 */

/**
 * Autoriza el acceso a rutas específicas según los roles permitidos.
 * @param {...string} allowedRoles - Roles con permiso de acceso (ej. 'Admin', 'User').
 * @returns {Function} Middleware de Express.
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        code: 401,
        message: 'Error de identidad. No se pudo verificar el rol del usuario.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        code: 403,
        message: 'Acceso denegado. Permisos insuficientes para realizar esta acción.',
        details: `Rol actual: ${req.user.role}, Roles requeridos: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = authorizeRoles;
