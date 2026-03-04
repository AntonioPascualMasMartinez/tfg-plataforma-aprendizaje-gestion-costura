require('dotenv').config(); // Carga las variables de entorno inmediatamente
const mongoose = require('mongoose');
const app = require('./app');

// Obtenemos variables críticas del entorno
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

/**
 * Función autoejecutable para inicializar los servicios
 */
const startServer = async () => {
  try {
    // 1. Validación de variables críticas
    if (!MONGO_URI) {
      throw new Error('FATAL ERROR: MONGO_URI no está definido en el archivo .env');
    }

    // 2. Conexión a la Base de Datos
    console.log('⏳ Conectando a MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conexión a la base de datos establecida con éxito.');

    // 3. Inicialización de la red (Escucha de peticiones HTTP)
    app.listen(PORT, () => {
      console.log(`🚀 Servidor backend inicializado y escuchando en el puerto ${PORT}`);
      console.log(`🛠️  Entorno de ejecución: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    // Captura de errores de arranque (ej. credenciales de DB incorrectas)
    console.error('❌ Error crítico durante la inicialización del servidor:');
    console.error(error.message);
    process.exit(1); // Aborta el proceso con código de error
  }
};

// Disparador de la inicialización
startServer();