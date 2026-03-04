const express = require('express');
const router = express.Router();
const ProjectController = require('./project.controller');
const authenticate = require('../../middlewares/auth.middleware');

// ==========================================
// Rutas Públicas (Disponibles sin inicio de sesión)
// ==========================================
router.get('/', ProjectController.getPublicFeed);
router.get('/:id', ProjectController.getDetails);

// ==========================================
// Rutas Privadas (Requieren Autenticación)
// ==========================================
router.use(authenticate); // Todo lo que esté debajo requerirá token JWT

router.post('/', ProjectController.create);
router.put('/:id', ProjectController.update);
router.delete('/:id', ProjectController.delete); // Borrado Lógico

// Sub-recursos (Pasos)
router.post('/:id/steps', ProjectController.addStep);

module.exports = router;
