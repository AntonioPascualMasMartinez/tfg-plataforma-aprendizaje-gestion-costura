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
router.get('/projects/:projectId/comments', CommunityController.getComments);

// ==========================================
// Rutas Privadas (Interacción de Usuarios)
// ==========================================
router.use(authenticate);

router.post('/projects/:projectId/comments', CommunityController.addComment);
router.post('/projects/:projectId/like', CommunityController.likeProject);
router.post('/reports', CommunityController.createReport);

// ==========================================
// Rutas Administrativas (Moderación)
// ==========================================
router.get('/admin/moderation', authorizeRoles('Admin'), CommunityController.getModerationQueue);
router.put('/admin/moderation/:id', authorizeRoles('Admin'), CommunityController.resolveReport);
router.delete(
  '/admin/comments/:id',
  authorizeRoles('Admin'),
  CommunityController.adminDeleteComment,
);

module.exports = router;
