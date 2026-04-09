/**
 * @fileoverview Definición de las rutas de la API para el catálogo y consumo de tutoriales.
 */
const express = require('express');
const router = express.Router();
const TutorialController = require('./tutorial.controller');
const authenticate = require('../../middlewares/auth.middleware');
const authorizeRoles = require('../../middlewares/rbac.middleware');

// ==========================================
// Rutas Públicas (Catálogo y Detalles)
// ==========================================
router.get('/', TutorialController.getCatalog);
router.get('/:id', TutorialController.getDetails);

// ==========================================
// Rutas Privadas (Requieren Autenticación)
// ==========================================
router.use(authenticate);

// Interacción del usuario final
router.post('/:id/start', TutorialController.start);
router.put('/:id/progress', TutorialController.updateProgress);

// Gestión de contenido (Requieren Rol 'Admin')
router.post('/', authorizeRoles('Admin'), TutorialController.create);
router.put('/:id', authorizeRoles('Admin'), TutorialController.update);
router.delete('/:id', authorizeRoles('Admin'), TutorialController.delete);

module.exports = router;
