const { v2: cloudinary } = require('cloudinary');
const logger = require('./logger');

// Validación temprana de variables de entorno para Cloudinary
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  logger.warn('⚠️ Credenciales de Cloudinary incompletas. La subida de imágenes podría fallar.');
} else {
  // Configuración del SDK
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true, // Forzar uso de HTTPS
  });
  logger.info('✅ Proveedor de almacenamiento multimedia (Cloudinary) configurado.');
}

module.exports = cloudinary;