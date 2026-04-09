/**
 * @fileoverview Configuración del proveedor de almacenamiento en la nube Cloudinary.
 */
const { v2: cloudinary } = require('cloudinary');
const logger = require('./logger');

if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  logger.warn('Credenciales de Cloudinary incompletas. La subida de imágenes podría fallar.');
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  logger.info('Proveedor Cloudinary configurado correctamente.');
}

module.exports = cloudinary;