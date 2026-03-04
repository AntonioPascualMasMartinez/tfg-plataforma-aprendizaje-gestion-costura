const express = require('express');
const router = express.Router();
const UploadController = require('./upload.controller');
const authenticate = require('../../middlewares/auth.middleware');
const { apiLimiter } = require('../../middlewares/rateLimiter.middleware');

// ==========================================
// Protección Global del Módulo
// ==========================================
// 1. Debe estar autenticado (Bloquea acceso público no autorizado)
router.use(authenticate);

// 2. Aplicamos limitación de tasa genérica para evitar spam de peticiones de firma
router.use(apiLimiter);

// ==========================================
// Rutas de Subida Multimedia
// ==========================================
// Endpoint: GET /api/v1/uploads/signature?folder=mi_carpeta
router.get('/signature', UploadController.getSignature);

module.exports = router;
