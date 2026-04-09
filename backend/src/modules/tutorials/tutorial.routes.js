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

/**
 * @swagger
 * /tutorials:
 *   get:
 *     summary: Obtiene el catálogo de tutoriales
 *     description: Devuelve un listado paginado de los tutoriales disponibles, con opciones de filtrado.
 *     tags:
 *       - Tutoriales
 *     security: []
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
 *           default: 10
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtra por categoría temática.
 *       - in: query
 *         name: difficultyLevel
 *         schema:
 *           type: string
 *           enum:
 *             - Principiante
 *             - Intermedio
 *             - Avanzado
 *       - in: query
 *         name: maxTime
 *         schema:
 *           type: integer
 *         description: Tiempo máximo estimado en minutos.
 *     responses:
 *       200:
 *         description: Catálogo de tutoriales recuperado.
 */

router.get('/', TutorialController.getCatalog);

/**
 * @swagger
 * /tutorials/{id}:
 *   get:
 *     summary: Obtiene los detalles de un tutorial
 *     description: Devuelve la información completa de un tutorial maestro, incluyendo sus pasos y materiales.
 *     tags:
 *       - Tutoriales
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalles del tutorial recuperados.
 *       404:
 *         description: Tutorial no encontrado.
 */
router.get('/:id', TutorialController.getDetails);

// ==========================================
// Rutas Privadas (Requieren Autenticación)
// ==========================================
router.use(authenticate);

/**
 * @swagger
 * /tutorials/{id}/start:
 *   post:
 *     summary: Inicia un tutorial guiado
 *     description: Comienza un tutorial. Esto crea automáticamente un proyecto clonado en el espacio personal del usuario y un registro de progreso.
 *     tags:
 *       - Tutoriales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Tutorial iniciado. Proyecto derivado creado.
 *       404:
 *         description: Tutorial maestro no encontrado.
 *       409:
 *         description: Ya has iniciado este tutorial previamente.
 */
router.post('/:id/start', TutorialController.start);

/**
 * @swagger
 * /tutorials/{id}/progress:
 *   put:
 *     summary: Actualiza el progreso del tutorial
 *     description: Actualiza el paso en el que se encuentra el usuario y calcula automáticamente el porcentaje de completitud.
 *     tags:
 *       - Tutoriales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - currentStep
 *             properties:
 *               currentStep:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Progreso actualizado correctamente.
 *       400:
 *         description: El paso enviado excede la longitud del tutorial.
 */

router.put('/:id/progress', TutorialController.updateProgress);

// ==========================================
// Gestión de contenido (Requieren Rol 'Admin')
// ==========================================

/**
 * @swagger
 * /tutorials:
 *   post:
 *     summary: Crea un nuevo tutorial maestro
 *     description: Registra un nuevo tutorial en la plataforma. Exclusivo para administradores.
 *     tags:
 *       - Administración - Tutoriales
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - steps
 *             properties:
 *               title:
 *                 type: string
 *                 example: Aprende a hacer dobladillos
 *               description:
 *                 type: string
 *                 example: Guía paso a paso para dominar los dobladillos invisibles.
 *               difficultyLevel:
 *                 type: string
 *                 enum:
 *                   - Principiante
 *                   - Intermedio
 *                   - Avanzado
 *                 example: Principiante
 *               category:
 *                 type: string
 *                 example: Técnicas Básicas
 *               estimatedTime:
 *                 type: integer
 *                 example: 45
 *               materialsNeeded:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     quantity:
 *                       type: string
 *               steps:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: integer
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     mediaUrl:
 *                       type: string
 *     responses:
 *       201:
 *         description: Tutorial creado exitosamente.
 *       403:
 *         description: Acceso denegado.
 */

router.post('/', authorizeRoles('Admin'), TutorialController.create);

/**
 * @swagger
 * /tutorials/{id}:
 *   put:
 *     summary: Actualiza un tutorial maestro
 *     description: Modifica los datos de un tutorial existente en el catálogo. Exclusivo para administradores.
 *     tags:
 *       - Administración - Tutoriales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Aprende a hacer dobladillos (Actualizado)
 *     responses:
 *       200:
 *         description: Tutorial actualizado exitosamente.
 *       404:
 *         description: Tutorial no encontrado.
 */
router.put('/:id', authorizeRoles('Admin'), TutorialController.update);

/**
 * @swagger
 * /tutorials/{id}:
 *   delete:
 *     summary: Elimina un tutorial maestro
 *     description: Borra permanentemente un tutorial de la plataforma. Exclusivo para administradores.
 *     tags:
 *       - Administración - Tutoriales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tutorial eliminado correctamente.
 *       404:
 *         description: Tutorial no encontrado.
 */
router.delete('/:id', authorizeRoles('Admin'), TutorialController.delete);

module.exports = router;
