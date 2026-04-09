/**
 * @fileoverview Punto de entrada de la aplicación. Inicializa conexiones y levanta el servidor.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

/**
 * Inicializa los servicios requeridos y arranca el servidor HTTP.
 * @returns {Promise<void>}
 */
const startServer = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error('Variables de entorno incompletas: MONGO_URI no definido.');
    }

    console.info('Estableciendo conexión con MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.info('Conexión a la base de datos establecida exitosamente.');

    app.listen(PORT, () => {
      console.info(`Servidor backend inicializado en el puerto ${PORT}`);
      console.info(`Entorno de ejecución: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Fallo crítico durante la inicialización del sistema:');
    console.error(error.message);
    process.exit(1);
  }
};

startServer();
