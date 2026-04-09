/**
 * @fileoverview Controlador responsable de la gestión de identidades, autenticación y sesiones.
 */
const AuthService = require('./auth.service');
const ResponseFormatter = require('../../utils/responseFormatter');
const authValidator = require('./auth.validator');
const ApiError = require('../../utils/apiError');

class AuthController {
  /**
   * Genera la configuración de seguridad para las cookies de sesión (Refresh Token).
   * @returns {Object} Opciones de configuración para la cookie.
   */
  static getCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

  /**
   * Procesa el registro de un nuevo usuario en la plataforma.
   * @param {Object} req - Petición Express.
   * @param {Object} res - Respuesta Express.
   * @param {Function} next - Callback de manejo de errores.
   */
  static async register(req, res, next) {
    try {
      const { error, value } = authValidator.register.validate(req.body, { abortEarly: false });
      if (error) {
        throw new ApiError(
          400,
          'Error de validación en el formulario de registro',
          true,
          error.details,
        );
      }

      const newUser = await AuthService.registerUser(value);
      return ResponseFormatter.success(res, 201, 'Usuario registrado con éxito', newUser);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Autentica a un usuario mediante credenciales y establece su sesión.
   * @param {Object} req - Petición Express.
   * @param {Object} res - Respuesta Express.
   * @param {Function} next - Callback de manejo de errores.
   */
  static async login(req, res, next) {
    try {
      const { error, value } = authValidator.login.validate(req.body);
      if (error) {
        throw new ApiError(400, 'Credenciales malformadas');
      }

      const { user, accessToken, refreshToken } = await AuthService.loginUser(
        value.email,
        value.password,
      );

      res.cookie('refreshToken', refreshToken, AuthController.getCookieOptions());

      return ResponseFormatter.success(res, 200, 'Inicio de sesión exitoso', {
        user,
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Renueva el Access Token utilizando un Refresh Token válido almacenado en las cookies.
   * @param {Object} req - Petición Express.
   * @param {Object} res - Respuesta Express.
   * @param {Function} next - Callback de manejo de errores.
   */
  static async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;
      const newAccessToken = await AuthService.refreshSession(refreshToken);

      return ResponseFormatter.success(res, 200, 'Sesión renovada con éxito', {
        accessToken: newAccessToken,
      });
    } catch (error) {
      res.clearCookie('refreshToken', AuthController.getCookieOptions());
      next(error);
    }
  }

  /**
   * Cierra la sesión activa del usuario invalidando su cookie de sesión.
   * @param {Object} req - Petición Express.
   * @param {Object} res - Respuesta Express.
   * @param {Function} next - Callback de manejo de errores.
   */
  static async logout(req, res, next) {
    try {
      res.clearCookie('refreshToken', AuthController.getCookieOptions());
      return ResponseFormatter.success(res, 200, 'Sesión cerrada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Inicia el flujo de recuperación de contraseña generando un token temporal.
   * @param {Object} req - Petición Express.
   * @param {Object} res - Respuesta Express.
   * @param {Function} next - Callback de manejo de errores.
   */
  static async recoverPassword(req, res, next) {
    try {
      const { error, value } = authValidator.recoverPassword.validate(req.body);
      if (error) {
        throw new ApiError(400, 'Correo no válido', true, error.details);
      }

      await AuthService.recoverPassword(value.email);

      return ResponseFormatter.success(
        res,
        200,
        'Si el correo existe, se han enviado las instrucciones de recuperación.',
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Restablece la contraseña de un usuario utilizando un token de recuperación válido.
   * @param {Object} req - Petición Express.
   * @param {Object} res - Respuesta Express.
   * @param {Function} next - Callback de manejo de errores.
   */
  static async resetPassword(req, res, next) {
    try {
      const { error, value } = authValidator.resetPassword.validate(req.body);
      if (error) {
        throw new ApiError(400, 'Datos inválidos', true, error.details);
      }

      await AuthService.resetPassword(value.token, value.newPassword);

      return ResponseFormatter.success(
        res,
        200,
        'Contraseña actualizada correctamente. Ya puedes iniciar sesión.',
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Autentica o registra a un usuario mediante el proveedor de identidad de Google (OAuth).
   * @param {Object} req - Petición Express.
   * @param {Object} res - Respuesta Express.
   * @param {Function} next - Callback de manejo de errores.
   */
  static async googleAuth(req, res, next) {
    try {
      const { error, value } = authValidator.googleAuth.validate(req.body);
      if (error) {
        throw new ApiError(400, 'Falta el token de proveedor de identidad', true, error.details);
      }

      const { user, accessToken, refreshToken } = await AuthService.googleAuth(value.idToken);

      res.cookie('refreshToken', refreshToken, AuthController.getCookieOptions());

      return ResponseFormatter.success(res, 200, 'Autenticación externa exitosa', {
        user,
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
