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

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Obtiene el perfil del usuario autenticado
 *     description: Devuelve la información completa del usuario basado en el token JWT proporcionado.
 *     tags:
 *       - Usuarios - Perfil
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil recuperado con éxito.
 *       401:
 *         description: No autorizado o token expirado.
 */

router.get('/me', UserController.getMe);

/**
 * @swagger
 * /users/me:
 *   put:
 *     summary: Actualiza el perfil del usuario
 *     description: Permite modificar campos específicos del perfil personal. Al menos un campo debe ser enviado.
 *     tags:
 *       - Usuarios - Perfil
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 example: Nuevo Nombre
 *               avatar:
 *                 type: string
 *                 example: https://res.cloudinary.com/.../imagen.jpg
 *               sewingLevel:
 *                 type: string
 *                 enum:
 *                   - Principiante
 *                   - Intermedio
 *                   - Experto
 *                 example: Intermedio
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - Corte y confección
 *                   - Upcycling
 *     responses:
 *       200:
 *         description: Perfil actualizado correctamente.
 *       400:
 *         description: Error de validación en los campos enviados.
 */
router.put('/me', UserController.updateMe);

/**
 * @swagger
 * /users/me/password:
 *   put:
 *     summary: Actualiza la contraseña
 *     description: Cambia la contraseña del usuario requiriendo la contraseña actual por seguridad.
 *     tags:
 *       - Usuarios - Perfil
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: ClaveAntigua123
 *               newPassword:
 *                 type: string
 *                 example: ClaveNueva456
 *     responses:
 *       200:
 *         description: Contraseña actualizada con éxito.
 *       400:
 *         description: Cuenta vinculada a Google sin contraseña configurada.
 *       401:
 *         description: La contraseña actual es incorrecta.
 */
router.put('/me/password', UserController.updatePassword);

/**
 * @swagger
 * /users/me:
 *   delete:
 *     summary: Elimina la cuenta del usuario
 *     description: Borra de forma permanente e irreversible la cuenta del usuario autenticado.
 *     tags:
 *       - Usuarios - Perfil
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cuenta eliminada con éxito.
 *       401:
 *         description: No autorizado.
 */
router.delete('/me', UserController.deleteMe);

// ==========================================
// Rutas Administrativas (Requieren Rol 'Admin')
// ==========================================

/**
 * @swagger
 * /users/admin/dashboard-stats:
 *   get:
 *     summary: Obtiene métricas y estadísticas (Dashboard)
 *     description: Recupera recuentos totales y datos agregados para pintar las gráficas del panel de administración.
 *     tags:
 *       - Administración - Usuarios
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas recuperadas con éxito.
 *       403:
 *         description: Acceso denegado (Requiere rol Admin).
 */
router.get('/admin/dashboard-stats', authorizeRoles('Admin'), UserController.getDashboardStats);

/**
 * @swagger
 * /users/admin:
 *   get:
 *     summary: Lista todos los usuarios registrados
 *     description: Obtiene un listado paginado de los usuarios de la plataforma. Exclusivo para administradores.
 *     tags:
 *       - Administración - Usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de resultados por página.
 *     responses:
 *       200:
 *         description: Listado de usuarios recuperado.
 *       403:
 *         description: Acceso denegado (Requiere rol Admin).
 */
router.get('/admin', authorizeRoles('Admin'), UserController.getAllUsers);

/**
 * @swagger
 * /users/admin/{id}/role:
 *   put:
 *     summary: Cambia el rol de un usuario
 *     description: Promueve o degrada a un usuario entre los roles User y Admin. Un administrador no puede auto-degradarse.
 *     tags:
 *       - Administración - Usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario a modificar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum:
 *                   - User
 *                   - Admin
 *                 example: Admin
 *     responses:
 *       200:
 *         description: Rol actualizado con éxito.
 *       400:
 *         description: Intento de auto-modificación de rol.
 *       403:
 *         description: Acceso denegado.
 *       404:
 *         description: Usuario no encontrado.
 */
router.put('/admin/:id/role', authorizeRoles('Admin'), UserController.changeRole);

/**
 * @swagger
 * /users/admin/{id}/status:
 *   put:
 *     summary: Banea o desbanea a un usuario
 *     description: Cambia el estado de activación de un usuario. Los usuarios inactivos no pueden acceder a la API.
 *     tags:
 *       - Administración - Usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario a modificar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Estado modificado con éxito.
 *       400:
 *         description: Intento de auto-baneo.
 *       403:
 *         description: Acceso denegado.
 */
router.put('/admin/:id/status', authorizeRoles('Admin'), UserController.toggleUserStatus);

module.exports = router;
