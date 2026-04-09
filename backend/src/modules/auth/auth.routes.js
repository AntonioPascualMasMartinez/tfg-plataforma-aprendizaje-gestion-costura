/**
 * @fileoverview Definición de las rutas de la API para la autenticación y gestión de sesiones.
 */
const express = require('express');
const router = express.Router();
const AuthController = require('./auth.controller');
const { authLimiter } = require('../../middlewares/rateLimiter.middleware');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registra un nuevo usuario en la plataforma
 *     description: Crea una nueva cuenta utilizando correo electrónico y contraseña.
 *     tags:
 *       - Auth
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - displayName
 *             properties:
 *               email:
 *                 type: string
 *                 example: nuevo_usuario@correo.com
 *               password:
 *                 type: string
 *                 example: MiContraseñaSegura123
 *               displayName:
 *                 type: string
 *                 example: Costurero Feliz
 *               sewingLevel:
 *                 type: string
 *                 enum:
 *                   - Principiante
 *                   - Intermedio
 *                   - Experto
 *                 example: Principiante
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - Bordado
 *                   - Patrones libres
 *     responses:
 *       201:
 *         description: Usuario registrado con éxito.
 *       400:
 *         description: Error de validación en los datos.
 *       409:
 *         description: El correo electrónico ya está registrado.
 */

router.post('/register', authLimiter, AuthController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Inicia sesión con credenciales locales
 *     description: Autentica al usuario y devuelve un Access Token. El Refresh Token se almacena automáticamente en una cookie httpOnly.
 *     tags:
 *       - Auth
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: nuevo_usuario@correo.com
 *               password:
 *                 type: string
 *                 example: MiContraseñaSegura123
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso.
 *       400:
 *         description: Credenciales malformadas.
 *       401:
 *         description: Correo o contraseña incorrectos.
 */

router.post('/login', authLimiter, AuthController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Renueva el Access Token de sesión
 *     description: Utiliza el Refresh Token almacenado en las cookies seguras del navegador para generar un nuevo Access Token de corta duración.
 *     tags:
 *       - Auth
 *     security: []
 *     responses:
 *       200:
 *         description: Sesión renovada con éxito (Nuevo Access Token).
 *       401:
 *         description: Refresh Token no proporcionado en las cookies.
 *       403:
 *         description: Refresh Token inválido o expirado.
 */

router.post('/refresh', AuthController.refresh);

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Autenticación delegada con Google Identity (OAuth2)
 *     description: Inicia sesión o registra a un usuario automáticamente validando el token de identidad proporcionado por Google.
 *     tags:
 *       - Auth
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 example: eyJhbGciOiJSUzI1NiIsImtpZ... (Token largo de Google)
 *     responses:
 *       200:
 *         description: Autenticación externa exitosa.
 *       400:
 *         description: Falta el token de Google.
 *       401:
 *         description: Token de Google inválido o expirado.
 */
router.post('/google', authLimiter, AuthController.googleAuth);

/**
 * @swagger
 * /auth/recover-password:
 *   post:
 *     summary: Solicita la recuperación de contraseña
 *     description: Inicia el flujo de olvido de contraseña generando un token temporal y enviándolo por correo electrónico al usuario.
 *     tags:
 *       - Auth
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: nuevo_usuario@correo.com
 *     responses:
 *       200:
 *         description: Instrucciones de recuperación enviadas (si el correo existe).
 *       400:
 *         description: Correo no válido o cuenta vinculada a Google.
 */
router.post('/recover-password', authLimiter, AuthController.recoverPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Restablece la contraseña olvidada
 *     description: Configura una nueva contraseña validando el token de recuperación que el usuario recibió por correo.
 *     tags:
 *       - Auth
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: d6f8g9h0j1k2l3m4n5o6
 *               newPassword:
 *                 type: string
 *                 example: MiNuevaClaveSuperSegura456
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente.
 *       400:
 *         description: Token inválido, expirado o contraseña malformada.
 */
router.post('/reset-password', authLimiter, AuthController.resetPassword);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Cierra la sesión activa
 *     description: Invalida la sesión del cliente eliminando la cookie segura que contiene el Refresh Token.
 *     tags:
 *       - Auth
 *     security: []
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente.
 */
router.post('/logout', AuthController.logout);

module.exports = router;
