const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../users/user.model'); // Importamos el modelo de usuarios
const ApiError = require('../../utils/apiError');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const transporter = require('../../config/mailer');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
  /**
   * Helper privado para generar ambos tokens (Access y Refresh)
   */
  static _generateTokens(user) {
    const payload = { id: user._id, role: user.role };

    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m', // Vida corta
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', // Vida larga
    });

    return { accessToken, refreshToken };
  }

  /**
   * Lógica de Registro de Usuario (RF1)
   */
  static async registerUser(userData) {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      // Si existe y tiene googleId pero NO password, le decimos que inicie sesión con Google
      if (existingUser.googleId && !existingUser.password) {
        throw new ApiError(
          409,
          'Este correo ya está registrado con Google. Inicia sesión con Google.',
        );
      }
      throw new ApiError(409, 'El correo electrónico ya está registrado en la plataforma.');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // userData ya trae opcionalmente sewingLevel e interests desde el controlador
    const newUser = await User.create({
      ...userData,
      password: hashedPassword,
    });

    const userResponse = newUser.toObject();
    delete userResponse.password;

    return userResponse;
  }

  /**
   * Lógica de Autenticación con Google (Registro / Inicio de sesión unificado)
   */
  static async googleAuth(idToken) {
    try {
      // 1. Verificar el token con Google
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      const { email, name, picture, sub: googleId } = payload;

      // 2. Buscar si el usuario ya existe
      let user = await User.findOne({ email });

      if (user) {
        // Si existe pero no tiene googleId, lo vinculamos (opcional, pero buena práctica)
        if (!user.googleId) {
          user.googleId = googleId;
          await user.save();
        }
      } else {
        // 3. Si no existe, lo creamos (Registro transparente)
        user = await User.create({
          email,
          displayName: name,
          avatar: picture,
          googleId,
          // Como no tenemos formulario, nivel e intereses quedarán como default/null
        });
      }

      // 4. Generar nuestros tokens (Access y Refresh)
      const tokens = this._generateTokens(user);

      const userProfile = user.toObject();
      delete userProfile.password; // Por si acaso se vinculó a una cuenta existente con password

      return { user: userProfile, ...tokens };
    } catch (error) {
      throw new ApiError(401, 'Token de Google inválido o expirado.');
    }
  }

  /**
   * Lógica de Inicio de Sesión (RF2)
   */
  static async loginUser(email, plainPassword) {
    // 1. Buscar al usuario y pedir explícitamente que devuelva el campo password (+password)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new ApiError(401, 'Credenciales inválidas. Correo o contraseña incorrectos.');
    }

    // 2. Verificar la firma criptográfica de la contraseña
    const isPasswordValid = await bcrypt.compare(plainPassword, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Credenciales inválidas. Correo o contraseña incorrectos.');
    }

    // 3. Generar el par de tokens
    const tokens = this._generateTokens(user);

    // 4. Limpiar la contraseña antes de devolver los datos del usuario
    const userProfile = user.toObject();
    delete userProfile.password;

    return { user: userProfile, ...tokens };
  }

  /**
   * Lógica de Renovación de Sesión mediante Refresh Token
   */
  static async refreshSession(refreshToken) {
    if (!refreshToken) {
      throw new ApiError(401, 'Refresh Token no proporcionado.');
    }

    try {
      // Verificar validez del Refresh Token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Asegurarnos de que el usuario aún existe en la base de datos
      const user = await User.findById(decoded.id);
      if (!user) {
        throw new ApiError(401, 'El usuario asociado a esta sesión ya no existe.');
      }

      // Generar y devolver un NUEVO Access Token
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
   * Genera un token de recuperación y lo guarda en el usuario (RF5)
   */
  static async recoverPassword(email) {
    const user = await User.findOne({ email });
    if (!user) return null; // Previene enumeración de emails

    // Si es un usuario de Google sin contraseña, le avisamos
    if (user.googleId && !user.password) {
      throw new ApiError(
        400,
        'Esta cuenta está vinculada a Google. Usa el inicio de sesión con Google.',
      );
    }

    // Generamos y guardamos el token criptográfico
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutos de validez

    await user.save({ validateBeforeSave: false });

    // Construimos la URL que el usuario clickeará
    // Asegúrate de tener FRONTEND_URL en tu .env (ej. http://localhost:4200)
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

    // 2. INTEGRACIÓN CON EL MAILER
    try {
      const mailOptions = {
        from: `"Equipo de Needly" <${process.env.SMTP_USER}>`, // Remitente
        to: user.email, // Destinatario
        subject: 'Recuperación de Contraseña - Needly',
        html: `
          <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto;">
            <h2 style="color: #FF5900;">Recuperación de Contraseña</h2>
            <p>Hola <strong>${user.displayName}</strong>,</p>
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Needly.</p>
            <p>Por favor, haz clic en el siguiente botón para crear una nueva contraseña. Este enlace es válido por 10 minutos:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #FF5900; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Restablecer mi contraseña
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">Si no has solicitado este cambio, puedes ignorar este correo de forma segura. Tu contraseña actual no cambiará.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px; text-align: center;">&copy; ${new Date().getFullYear()} Needly. Todos los derechos reservados.</p>
          </div>
        `,
      };

      // Enviamos el correo usando el transporter que creaste en mailer.js
      await transporter.sendMail(mailOptions);
    } catch (error) {
      // Si falla el envío de correo, limpiamos el token de la BBDD para no dejarlo colgado
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      throw new ApiError(500, 'Error al enviar el correo de recuperación. Inténtalo más tarde.');
    }

    // No devolvemos el token al frontend por seguridad, solo indicamos que se envió el correo
    return true;
  }

  /**
   * Valida el token y actualiza la contraseña (RF5)
   */
  static async resetPassword(token, newPassword) {
    // Hashear el token recibido para compararlo con el de la base de datos
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }, // Verifica que no haya expirado
    });

    if (!user) {
      throw new ApiError(400, 'El token de recuperación es inválido o ha expirado.');
    }

    // Actualizar contraseña
    const saltRounds = 10;
    user.password = await bcrypt.hash(newPassword, saltRounds);

    // Limpiar los campos de recuperación
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    return true;
  }
}

module.exports = AuthService;
