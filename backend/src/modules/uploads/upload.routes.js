/**
 * @fileoverview Definición de las rutas de la API para la gestión de firmas y subidas multimedia.
 */
const express = require('express');
const router = express.Router();
const UploadController = require('./upload.controller');
const authenticate = require('../../middlewares/auth.middleware');
const { apiLimiter } = require('../../middlewares/rateLimiter.middleware');

// ==========================================
// Middlewares Globales del Módulo
// ==========================================
router.use(authenticate);
router.use(apiLimiter);

// ==========================================
// Rutas de Configuración Multimedia
// ==========================================
/**
 * @swagger
 * /uploads/signature:
 *   get:
 *     summary: Obtiene la firma criptográfica para subidas a Cloudinary
 *     description: Genera y devuelve los parámetros de seguridad y la firma SHA necesarios para que el cliente pueda realizar subidas directas a Cloudinary sin exponer el API Secret del servidor.
 *     tags:
 *       - Multimedia
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *           default: costura_projects
 *         description: Nombre de la carpeta de destino en Cloudinary (solo caracteres alfanuméricos).
 *     responses:
 *       200:
 *         description: Firma generada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Firma de seguridad generada exitosamente. Lista para subida directa.
 *                 data:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: integer
 *                       example: 1715423891
 *                     signature:
 *                       type: string
 *                       example: a1b2c3d4e5f6g7h8i9j0
 *                     folder:
 *                       type: string
 *                       example: costura_projects
 *                     cloudName:
 *                       type: string
 *                       example: dxx12345
 *                     apiKey:
 *                       type: string
 *                       example: 123456789012345
 *       401:
 *         description: No autorizado (Token faltante o inválido).
 */
router.get('/signature', UploadController.getSignature);

module.exports = router;
