const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Establece la conexión asíncrona con MongoDB Atlas utilizando Mongoose.
 */
const connectDB = async () => {
  try {
    // Mongoose 8.x ya no requiere las opciones deprecadas useNewUrlParser o useUnifiedTopology
    const conn = await mongoose.connect(process.env.MONGO_URI);
    logger.info(`✅ Conexión a MongoDB Atlas establecida: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`❌ Error crítico conectando a MongoDB: ${error.message}`);
    process.exit(1); // Aborta el proceso si no hay base de datos (Fallo temprano)
  }
};

// Listeners para monitorizar el ciclo de vida de la conexión y aplicar resiliencia
mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️ Conexión con MongoDB perdida. Intentando reconectar...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('🔄 MongoDB reconectado exitosamente.');
});

mongoose.connection.on('error', (err) => {
  logger.error(`❌ Error en la conexión de MongoDB: ${err.message}`);
});

module.exports = connectDB;