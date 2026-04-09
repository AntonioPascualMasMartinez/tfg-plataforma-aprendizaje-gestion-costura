/**
 * @fileoverview Configuración y gestión de la conexión a la base de datos MongoDB.
 */
const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Establece la conexión asíncrona con MongoDB Atlas.
 * Aborta el proceso si la conexión inicial falla.
 * * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    logger.info(`Conexión a MongoDB Atlas establecida: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Error crítico conectando a MongoDB: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('Conexión con MongoDB perdida. Intentando reconectar...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconectado exitosamente.');
});

mongoose.connection.on('error', (err) => {
  logger.error(`Error en la conexión de MongoDB: ${err.message}`);
});

module.exports = connectDB;
