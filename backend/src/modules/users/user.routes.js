/**
 * @fileoverview Definición de las rutas de la API para la gestión de usuarios y perfiles.
 */
const express = require('express');
const router = express.Router();
const UserController = require('./user.controller');
const authenticate = require('../../middlewares/auth.middleware');
const authorizeRoles = require('../../middlewares/rbac.middleware');

// ==========================================
// Middleware de Autenticación Global
// ==========================================
// Todas las rutas de usuarios requieren que el usuario esté autenticado.
router.use(authenticate);

// ==========================================
// Rutas de Perfil Personal (Cualquier usuario autenticado)
// ==========================================
router.get('/me', UserController.getMe);
router.put('/me', UserController.updateMe);
router.put('/me/password', UserController.updatePassword);
router.delete('/me', UserController.deleteMe);

// ==========================================
// Rutas Administrativas (Requieren Rol 'Admin')
// ==========================================
router.get('/admin/dashboard-stats', authorizeRoles('Admin'), UserController.getDashboardStats);

router.get('/admin', authorizeRoles('Admin'), UserController.getAllUsers);

router.put('/admin/:id/role', authorizeRoles('Admin'), UserController.changeRole);

router.put('/admin/:id/status', authorizeRoles('Admin'), UserController.toggleUserStatus);

module.exports = router;
