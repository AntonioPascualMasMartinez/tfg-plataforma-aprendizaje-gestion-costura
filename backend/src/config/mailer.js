/**
 * @fileoverview Configuración del servicio de envío de correos electrónicos mediante Nodemailer.
 */
const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter
    .verify()
    .then(() => {
      logger.info('Servicio SMTP autenticado y listo para enviar correos.');
    })
    .catch((error) => {
      logger.error(`Error en la autenticación del servicio SMTP: ${error.message}`);
    });
} else {
  logger.warn('Variables de entorno SMTP no definidas. El envío de correos está deshabilitado.');
}

module.exports = transporter;
