const nodemailer = require('nodemailer');
const logger = require('./logger');

// Construcción del transporter utilizando SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 465,
  secure: true, // true para el puerto 465 (SSL implícito), false para otros puertos (como 587)
  auth: {
    user: process.env.SMTP_USER, // e.g., 'tu-correo@gmail.com'
    pass: process.env.SMTP_PASS, // e.g., 'contraseña de aplicación'
  },
});

// Verificar la conectividad SMTP al arrancar el servidor (opcional, pero recomendado)
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter
    .verify()
    .then(() => {
      logger.info('✅ Servicio SMTP (Nodemailer) autenticado y listo para enviar correos.');
    })
    .catch((error) => {
      logger.error(`❌ Error en la autenticación del servicio SMTP: ${error.message}`);
    });
} else {
  logger.warn('⚠️ Variables de entorno SMTP no definidas. El envío de correos está deshabilitado.');
}

module.exports = transporter;