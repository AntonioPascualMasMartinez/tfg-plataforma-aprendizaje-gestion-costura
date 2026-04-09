/**
 * @fileoverview Servicio encargado de la lógica de negocio para identidades, autenticación,
 * integración con OAuth (Google) y flujos de recuperación de contraseñas.
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../users/user.model');
const ApiError = require('../../utils/apiError');
const transporter = require('../../config/mailer');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
  /**
   * Genera los tokens de acceso y actualización para un usuario autenticado.
   * @private
   * @param {Object} user - Documento del usuario.
   * @returns {Object} Objeto que contiene accessToken y refreshToken.
   */
  static _generateTokens(user) {
    const payload = { id: user._id, role: user.role };

    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    return { accessToken, refreshToken };
  }

  /**
   * Registra un nuevo usuario en la base de datos utilizando credenciales locales.
   * @param {Object} userData - Datos de registro del usuario.
   * @returns {Promise<Object>} Perfil del usuario creado sin la contraseña.
   * @throws {ApiError} Si el correo ya está registrado.
   */
  static async registerUser(userData) {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      if (existingUser.googleId && !existingUser.password) {
        throw new ApiError(
          409,
          'Este correo ya está registrado con Google. Inicie sesión mediante ese proveedor.',
        );
      }
      throw new ApiError(409, 'El correo electrónico ya está registrado en la plataforma.');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    const newUser = await User.create({
      ...userData,
      password: hashedPassword,
    });

    const userResponse = newUser.toObject();
    delete userResponse.password;

    return userResponse;
  }

  /**
   * Procesa la autenticación delegada a través de Google. Registra al usuario si no existe.
   * @param {string} idToken - Token de identidad proporcionado por Google.
   * @returns {Promise<Object>} Objeto con el perfil del usuario y los tokens de sesión.
   * @throws {ApiError} Si el token es inválido o ha expirado.
   */
  static async googleAuth(idToken) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      const { email, name, picture, sub: googleId } = payload;

      let user = await User.findOne({ email });

      if (user) {
        if (!user.googleId) {
          user.googleId = googleId;
          await user.save();
        }
      } else {
        user = await User.create({
          email,
          displayName: name,
          avatar: picture,
          googleId,
        });
      }

      const tokens = this._generateTokens(user);

      const userProfile = user.toObject();
      delete userProfile.password;

      return { user: userProfile, ...tokens };
    } catch (error) {
      throw new ApiError(401, 'Token de Google inválido o expirado.');
    }
  }

  /**
   * Verifica las credenciales locales y establece una nueva sesión.
   * @param {string} email - Correo electrónico del usuario.
   * @param {string} plainPassword - Contraseña sin cifrar.
   * @returns {Promise<Object>} Objeto con el perfil del usuario y los tokens de sesión.
   * @throws {ApiError} Si las credenciales son incorrectas.
   */
  static async loginUser(email, plainPassword) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new ApiError(401, 'Credenciales inválidas. Correo o contraseña incorrectos.');
    }

    const isPasswordValid = await bcrypt.compare(plainPassword, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Credenciales inválidas. Correo o contraseña incorrectos.');
    }

    const tokens = this._generateTokens(user);

    const userProfile = user.toObject();
    delete userProfile.password;

    return { user: userProfile, ...tokens };
  }

  /**
   * Genera un nuevo Access Token a partir de un Refresh Token válido.
   * @param {string} refreshToken - Token de renovación de sesión.
   * @returns {Promise<string>} Nuevo Access Token.
   * @throws {ApiError} Si el token es inválido, ha expirado o el usuario ya no existe.
   */
  static async refreshSession(refreshToken) {
    if (!refreshToken) {
      throw new ApiError(401, 'Refresh Token no proporcionado.');
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      const user = await User.findById(decoded.id);
      if (!user) {
        throw new ApiError(401, 'El usuario asociado a esta sesión ya no existe.');
      }

      const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
      );

      return accessToken;
    } catch (error) {
      throw new ApiError(403, 'Refresh Token inválido o expirado. Inicie sesión nuevamente.');
    }
  }

  /**
   * Inicia el proceso de recuperación de contraseña generando un token temporal y enviando un correo.
   * @param {string} email - Correo electrónico del usuario.
   * @returns {Promise<boolean|null>} true si se procesó correctamente, null si el usuario no existe.
   * @throws {ApiError} Si la cuenta es exclusiva de Google o falla el envío del correo.
   */
  static async recoverPassword(email) {
    const user = await User.findOne({ email });
    if (!user) return null;

    if (user.googleId && !user.password) {
      throw new ApiError(
        400,
        'Esta cuenta está vinculada a Google. Utilice el inicio de sesión con dicho proveedor.',
      );
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

    try {
      const mailOptions = {
        from: `"Equipo de Needly" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Recuperación de Contraseña - Needly',
        html: `
          <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto;">
            <h2 style="color: #FF5900;">Recuperación de Contraseña</h2>
            <p>Hola <strong>${user.displayName}</strong>,</p>
            <p>Hemos recibido una solicitud para restablecer la contraseña de su cuenta en Needly.</p>
            <p>Por favor, haga clic en el siguiente enlace para crear una nueva contraseña. Este enlace expirará en 10 minutos:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #FF5900; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Restablecer mi contraseña
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">Si no ha solicitado este cambio, puede ignorar este correo de forma segura.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px; text-align: center;">&copy; ${new Date().getFullYear()} Needly. Todos los derechos reservados.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      throw new ApiError(500, 'Error al enviar el correo de recuperación. Inténtelo más tarde.');
    }

    return true;
  }

  /**
   * Restablece la contraseña de un usuario mediante la verificación del token temporal.
   * @param {string} token - Token criptográfico de recuperación.
   * @param {string} newPassword - Nueva contraseña proporcionada por el usuario.
   * @returns {Promise<boolean>} true si la contraseña se actualiza con éxito.
   * @throws {ApiError} Si el token es inválido o ha expirado.
   */
  static async resetPassword(token, newPassword) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(400, 'El token de recuperación es inválido o ha expirado.');
    }

    const saltRounds = 10;
    user.password = await bcrypt.hash(newPassword, saltRounds);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    return true;
  }
}

module.exports = AuthService;
