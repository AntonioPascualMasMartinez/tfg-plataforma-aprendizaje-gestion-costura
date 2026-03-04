const express = require('express');
const router = express.Router();
const CommunityController = require('./community.controller');
const authenticate = require('../../middlewares/auth.middleware');
const authorizeRoles = require('../../middlewares/rbac.middleware');

// Rutas Públicas
router.get('/projects/:projectId/comments', CommunityController.getComments);

// Rutas Privadas (Requieren Autenticación)
router.use(authenticate);

router.post('/projects/:projectId/comments', CommunityController.addComment);
router.post('/projects/:projectId/like', CommunityController.likeProject);
router.post('/reports', CommunityController.createReport);

// Rutas Administrativas (Protegidas por RBAC)
router.get('/admin/moderation', authorizeRoles('Admin'), CommunityController.getModerationQueue);

module.exports = router;
