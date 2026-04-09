/**
 * @fileoverview Definición de las rutas de la API para la gestión de proyectos de costura.
 */
const express = require('express');
const router = express.Router();
const ProjectController = require('./project.controller');
const authenticate = require('../../middlewares/auth.middleware');

// ==========================================
// Rutas de Lectura y Navegación
// ==========================================
router.get('/', ProjectController.getPublicFeed);
router.get('/:id', ProjectController.getDetails);

// ==========================================
// Rutas Privadas (Requieren Autenticación)
// ==========================================
router.use(authenticate);

router.get('/user/me', ProjectController.getMyProjects);
router.post('/', ProjectController.create);
router.put('/:id', ProjectController.update);
router.delete('/:id', ProjectController.delete);
router.post('/:id/steps', ProjectController.addStep);

module.exports = router;
