const express = require('express');
const router = express.Router();
const TutorialController = require('./tutorial.controller');
const authenticate = require('../../middlewares/auth.middleware');

// Ruta pública (Catálogo de cursos)
router.get('/', TutorialController.getCatalog);

// Rutas privadas (Interacción y aprendizaje)
router.use(authenticate);

router.post('/:id/start', TutorialController.start);
router.put('/:id/progress', TutorialController.updateProgress);

module.exports = router;
