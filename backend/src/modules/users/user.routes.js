const express = require('express');
const router = express.Router();
const UserController = require('./user.controller');
const authenticate = require('../../middlewares/auth.middleware');
const authorizeRoles = require('../../middlewares/rbac.middleware');

// ==========================================
// Rutas de Perfil Personal (Requieren Autenticación)
// ==========================================
// Aplicamos el middleware de autenticación a todas las rutas de este router
router.use(authenticate);

router.get('/me', UserController.getMe);
router.put('/me', UserController.updateMe);

// ==========================================
// Rutas Administrativas (Requieren Rol 'Admin')
// ==========================================
router.get(
  '/admin',
  authorizeRoles('Admin'), // Control de Acceso Basado en Roles (RNF28)
  UserController.getAllUsers,
);

// ==========================================
// Rutas Administrativas (Requieren Rol 'Admin')
// ==========================================
router.get('/admin', authorizeRoles('Admin'), UserController.getAllUsers);

// Nueva ruta para RF7
router.put('/admin/:id/role', authorizeRoles('Admin'), UserController.changeRole);

module.exports = router;
