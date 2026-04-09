/**
 * @fileoverview Definición de las rutas de la API para la interacción social y la moderación.
 */
const express = require('express');
const router = express.Router();
const CommunityController = require('./community.controller');
const authenticate = require('../../middlewares/auth.middleware');
const authorizeRoles = require('../../middlewares/rbac.middleware');

// ==========================================
// Rutas Públicas de la Comunidad
// ==========================================

/**
 * @swagger
 * /community/projects/{projectId}/comments:
 *   get:
 *     summary: Obtiene los comentarios de un proyecto
 *     description: Recupera un listado paginado de los comentarios publicados en un proyecto específico.
 *     tags:
 *       - Comunidad
 *     security: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del proyecto.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Comentarios recuperados exitosamente.
 */
router.get('/projects/:projectId/comments', CommunityController.getComments);

// ==========================================
// Rutas Privadas (Interacción de Usuarios)
// ==========================================
router.use(authenticate);

/**
 * @swagger
 * /community/projects/{projectId}/comments:
 *   post:
 *     summary: Publica un comentario
 *     description: Añade un nuevo comentario al proyecto especificado.
 *     tags:
 *       - Comunidad
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: ¡Me encanta la elección de los colores! Gran trabajo.
 *     responses:
 *       201:
 *         description: Comentario publicado con éxito.
 *       400:
 *         description: El comentario no puede estar vacío o excede la longitud máxima.
 *       404:
 *         description: Proyecto no encontrado.
 */
router.post('/projects/:projectId/comments', CommunityController.addComment);

/**
 * @swagger
 * /community/projects/{projectId}/like:
 *   post:
 *     summary: Alterna el 'Me gusta' de un proyecto
 *     description: Si el usuario ya había dado like, lo retira. Si no, lo añade. Retorna el nuevo conteo total.
 *     tags:
 *       - Comunidad
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Like actualizado con éxito.
 *       404:
 *         description: Proyecto no encontrado.
 */
router.post('/projects/:projectId/like', CommunityController.likeProject);

/**
 * @swagger
 * /community/reports:
 *   post:
 *     summary: Reporta contenido inapropiado
 *     description: Envía un reporte a la cola de moderación sobre un proyecto o comentario.
 *     tags:
 *       - Comunidad
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetType
 *               - targetId
 *               - reason
 *             properties:
 *               targetType:
 *                 type: string
 *                 enum:
 *                   - Project
 *                   - Comment
 *                 example: Comment
 *               targetId:
 *                 type: string
 *                 example: 64b1f... (ID del comentario o proyecto)
 *               reason:
 *                 type: string
 *                 example: Lenguaje ofensivo y faltas de respeto.
 *     responses:
 *       201:
 *         description: Contenido reportado exitosamente.
 *       409:
 *         description: El usuario ya ha reportado este contenido previamente.
 */
router.post('/reports', CommunityController.createReport);

// ==========================================
// Rutas Administrativas (Moderación)
// ==========================================

/**
 * @swagger
 * /community/admin/moderation:
 *   get:
 *     summary: Obtiene la cola de moderación
 *     description: Devuelve un listado paginado de los reportes enviados por la comunidad. Exclusivo para administradores.
 *     tags:
 *       - Administración - Comunidad
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - Pending
 *             - Reviewed
 *             - Dismissed
 *           default: Pending
 *     responses:
 *       200:
 *         description: Cola de moderación recuperada exitosamente.
 *       403:
 *         description: Acceso denegado.
 */

router.get('/admin/moderation', authorizeRoles('Admin'), CommunityController.getModerationQueue);

/**
 * @swagger
 * /community/admin/moderation/{id}:
 *   put:
 *     summary: Resuelve un reporte
 *     description: Cambia el estado de un reporte en la cola (ej. a Reviewed o Dismissed). Exclusivo para administradores.
 *     tags:
 *       - Administración - Comunidad
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del reporte.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum:
 *                   - Reviewed
 *                   - Dismissed
 *                 example: Reviewed
 *     responses:
 *       200:
 *         description: Reporte resuelto exitosamente.
 *       404:
 *         description: Reporte no encontrado.
 */
router.put('/admin/moderation/:id', authorizeRoles('Admin'), CommunityController.resolveReport);

/**
 * @swagger
 * /community/admin/comments/{id}:
 *   delete:
 *     summary: Elimina un comentario (Moderación severa)
 *     description: Borra permanentemente de la base de datos un comentario infractor. Exclusivo para administradores.
 *     tags:
 *       - Administración - Comunidad
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del comentario a borrar.
 *     responses:
 *       200:
 *         description: Comentario eliminado por moderación.
 *       404:
 *         description: Comentario no encontrado.
 */
router.delete(
  '/admin/comments/:id',
  authorizeRoles('Admin'),
  CommunityController.adminDeleteComment,
);

module.exports = router;