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
router.get('/signature', UploadController.getSignature);

module.exports = router;
