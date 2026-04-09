/**
 * @fileoverview Punto de entrada adaptado para Vercel (Serverless) y Local.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Variable global para cachear la conexión a la base de datos en Vercel
let isConnected;

const connectToDatabase = async () => {
  if (isConnected) {
    console.info('Utilizando conexión a MongoDB existente.');
    return;
  }

  try {
    if (!MONGO_URI) throw new Error('MONGO_URI no definido.');

    console.info('Estableciendo nueva conexión con MongoDB Atlas...');
    const db = await mongoose.connect(MONGO_URI);
    isConnected = db.connections[0].readyState;
    console.info('Conexión a la base de datos establecida exitosamente.');
  } catch (error) {
    console.error('Fallo crítico durante la inicialización de la BD:', error.message);
    process.exit(1);
  }
};

// Middleware: Asegurar que la BD está conectada antes de cualquier petición en Vercel
app.use(async (req, res, next) => {
  await connectToDatabase();
  next();
});

// Entorno Local: Solo usamos app.listen si no estamos en producción (Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, async () => {
    await connectToDatabase();
    console.info(`Servidor local inicializado en el puerto ${PORT}`);
  });
}

// Exportamos la app para que Vercel la ejecute como Función Serverless
module.exports = app;
