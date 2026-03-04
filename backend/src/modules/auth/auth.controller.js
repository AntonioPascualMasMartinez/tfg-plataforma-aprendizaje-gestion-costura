const AuthService = require('./auth.service');
const ResponseFormatter = require('../../utils/responseFormatter');
const authValidator = require('./auth.validator');
const ApiError = require('../../utils/apiError');

class AuthController {
  /**
   * Opciones de seguridad para la Cookie del Refresh Token
   */
  static getCookieOptions() {
    return {
      httpOnly: true, // Mitiga XSS: JavaScript del cliente no puede leerla
      secure: process.env.NODE_ENV === 'production', // Solo viaja por HTTPS en producción
      sameSite: 'strict', // Mitiga CSRF: Solo se envía en peticiones del mismo dominio
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en milisegundos
    };
  }

  /**
   * POST /api/v1/auth/register
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
   * POST /api/v1/auth/login
   */
  static async login(req, res, next) {
    try {
      const { error, value } = authValidator.login.validate(req.body);
      if (error) throw new ApiError(400, 'Credenciales malformadas');

      const { user, accessToken, refreshToken } = await AuthService.loginUser(
        value.email,
        value.password,
      );

      // Inyectar el Refresh Token en una Cookie segura
      res.cookie('refreshToken', refreshToken, AuthController.getCookieOptions());

      // Devolver solo el Access Token y el perfil en el cuerpo JSON
      return ResponseFormatter.success(res, 200, 'Inicio de sesión exitoso', {
        user,
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/refresh
   */
  static async refresh(req, res, next) {
    try {
      // Extraer el Refresh Token de las cookies parseadas (gracias a cookie-parser)
      const refreshToken = req.cookies.refreshToken;

      const newAccessToken = await AuthService.refreshSession(refreshToken);

      return ResponseFormatter.success(res, 200, 'Sesión renovada con éxito', {
        accessToken: newAccessToken,
      });
    } catch (error) {
      // Si el refresh falla, limpiamos la cookie corrupta o expirada
      res.clearCookie('refreshToken', AuthController.getCookieOptions());
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  static async logout(req, res, next) {
    try {
      // Invalida la sesión eliminando la cookie del cliente
      res.clearCookie('refreshToken', AuthController.getCookieOptions());
      return ResponseFormatter.success(res, 200, 'Sesión cerrada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/recover-password
   */
  static async recoverPassword(req, res, next) {
    try {
      const { error, value } = authValidator.recoverPassword.validate(req.body);
      if (error) throw new ApiError(400, 'Correo no válido', true, error.details);

      await AuthService.recoverPassword(value.email);

      // Siempre devolvemos el mismo mensaje para no revelar qué emails existen
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
   * POST /api/v1/auth/reset-password
   */
  static async resetPassword(req, res, next) {
    try {
      const { error, value } = authValidator.resetPassword.validate(req.body);
      if (error) throw new ApiError(400, 'Datos inválidos', true, error.details);

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
   * POST /api/v1/auth/google
   */
  static async googleAuth(req, res, next) {
    try {
      const { error, value } = authValidator.googleAuth.validate(req.body);
      if (error) throw new ApiError(400, 'Falta el token de Google', true, error.details);

      // AuthService.googleAuth devuelve { user, accessToken, refreshToken }
      const { user, accessToken, refreshToken } = await AuthService.googleAuth(value.idToken);

      // Inyectamos el Refresh Token en la cookie igual que en el login normal
      res.cookie('refreshToken', refreshToken, AuthController.getCookieOptions());

      return ResponseFormatter.success(res, 200, 'Autenticación con Google exitosa', {
        user,
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
