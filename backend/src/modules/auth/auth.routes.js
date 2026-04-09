/**
 * @fileoverview Definición de las rutas de la API para la autenticación y gestión de sesiones.
 */
const express = require('express');
const router = express.Router();
const AuthController = require('./auth.controller');
const { authLimiter } = require('../../middlewares/rateLimiter.middleware');

router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/google', authLimiter, AuthController.googleAuth);
router.post('/recover-password', authLimiter, AuthController.recoverPassword);
router.post('/reset-password', authLimiter, AuthController.resetPassword);
router.post('/logout', AuthController.logout);

module.exports = router;
