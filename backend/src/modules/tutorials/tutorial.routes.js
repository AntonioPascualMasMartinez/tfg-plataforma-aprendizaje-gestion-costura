const express = require('express');
const router = express.Router();
const TutorialController = require('./tutorial.controller');
const authenticate = require('../../middlewares/auth.middleware');
const authorizeRoles = require('../../middlewares/rbac.middleware'); // <-- NUEVO: Importar middleware de roles

// ==========================================
// Rutas Públicas
// ==========================================
router.get('/', TutorialController.getCatalog);
router.get('/:id', TutorialController.getDetails); // La que añadimos en el paso anterior

// ==========================================
// Rutas Privadas
// ==========================================
router.use(authenticate);

// Creación de contenido (SOLO ADMINS)
router.post('/', authorizeRoles('Admin'), TutorialController.create); // <-- NUEVA RUTA PROTEGIDA

// Interacción de los usuarios con el tutorial
router.post('/:id/start', TutorialController.start);
router.put('/:id/progress', TutorialController.updateProgress);

module.exports = router;
