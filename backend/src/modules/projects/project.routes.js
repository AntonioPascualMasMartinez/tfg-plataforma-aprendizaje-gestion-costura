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

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Obtiene el feed público de proyectos
 *     description: Devuelve un listado paginado de los proyectos que los usuarios han marcado como públicos.
 *     tags:
 *       - Proyectos
 *     security: []
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por título del proyecto.
 *       - in: query
 *         name: projectType
 *         schema:
 *           type: string
 *           enum:
 *             - Nuevo
 *             - Comenzado desde Tutorial
 *             - Adaptado de la Comunidad
 *         description: Filtra por el origen del proyecto.
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum:
 *             - fecha
 *             - popularidad
 *           default: fecha
 *         description: Criterio de ordenación.
 *     responses:
 *       200:
 *         description: Feed de proyectos recuperado exitosamente.
 */

router.get('/', ProjectController.getPublicFeed);

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Obtiene los detalles de un proyecto
 *     description: Devuelve la información completa de un proyecto específico, incluyendo materiales y pasos.
 *     tags:
 *       - Proyectos
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador único del proyecto.
 *     responses:
 *       200:
 *         description: Detalles del proyecto recuperados.
 *       404:
 *         description: Proyecto no encontrado.
 */

router.get('/:id', ProjectController.getDetails);

// ==========================================
// Rutas Privadas (Requieren Autenticación)
// ==========================================
router.use(authenticate);

/**
 * @swagger
 * /projects/user/me:
 *   get:
 *     summary: Obtiene el taller personal del usuario
 *     description: Devuelve el listado paginado de los proyectos (públicos y privados) pertenecientes al usuario autenticado.
 *     tags:
 *       - Proyectos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - Todos
 *             - Planificado
 *             - En curso
 *             - Pausado
 *             - Finalizado
 *           default: Todos
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum:
 *             - nuevo
 *             - nombre
 *           default: nuevo
 *     responses:
 *       200:
 *         description: Taller personal recuperado.
 *       401:
 *         description: No autorizado.
 */

router.get('/user/me', ProjectController.getMyProjects);

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Crea un nuevo proyecto
 *     description: Registra un nuevo proyecto textil asociado al usuario autenticado.
 *     tags:
 *       - Proyectos
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
 *               - projectType
 *               - category
 *               - difficulty
 *             properties:
 *               title:
 *                 type: string
 *                 example: Falda de Vuelo
 *               projectType:
 *                 type: string
 *                 enum:
 *                   - Nuevo
 *                   - Comenzado desde Tutorial
 *                   - Adaptado de la Comunidad
 *                 example: Nuevo
 *               category:
 *                 type: string
 *                 example: Ropa de verano
 *               difficulty:
 *                 type: string
 *                 enum:
 *                   - Fácil
 *                   - Intermedio
 *                   - Avanzado
 *                 example: Fácil
 *               isPublic:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Proyecto creado exitosamente.
 *       400:
 *         description: Error de validación.
 */
router.post('/', ProjectController.create);

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     summary: Actualiza un proyecto existente
 *     description: Modifica la información de un proyecto. Requiere ser el propietario del proyecto.
 *     tags:
 *       - Proyectos
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
 *                 example: Falda de Vuelo (Editada)
 *               status:
 *                 type: string
 *                 enum:
 *                   - Planificado
 *                   - En curso
 *                   - Pausado
 *                   - Finalizado
 *                 example: En curso
 *     responses:
 *       200:
 *         description: Proyecto actualizado.
 *       403:
 *         description: No tienes permisos para modificar este proyecto.
 *       404:
 *         description: Proyecto no encontrado.
 */
router.put('/:id', ProjectController.update);

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: Elimina un proyecto (Borrado Lógico)
 *     description: Oculta un proyecto marcándolo con una fecha de eliminación. Solo el propietario puede realizar esta acción.
 *     tags:
 *       - Proyectos
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
 *         description: Proyecto eliminado correctamente.
 *       403:
 *         description: Permisos insuficientes.
 */
router.delete('/:id', ProjectController.delete);

/**
 * @swagger
 * /projects/{id}/steps:
 *   post:
 *     summary: Añade un nuevo paso al proyecto
 *     description: Inserta un nuevo paso al final de la lista de pasos del proyecto especificado.
 *     tags:
 *       - Proyectos
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
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 example: Cortar la tela
 *               description:
 *                 type: string
 *                 example: Usar el patrón base para cortar las piezas frontales y traseras.
 *               mediaUrl:
 *                 type: string
 *                 example: https://res.cloudinary.com/.../imagen.jpg
 *     responses:
 *       201:
 *         description: Paso añadido al proyecto.
 *       400:
 *         description: Error de validación en el paso.
 *       403:
 *         description: Permisos insuficientes.
 */
router.post('/:id/steps', ProjectController.addStep);

module.exports = router;