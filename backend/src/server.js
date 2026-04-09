/**
 * @fileoverview Punto de entrada robusto para Vercel Serverless.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const MONGO_URI = process.env.MONGO_URI;

// Cache de conexión para reutilizarla entre ejecuciones de la función
let cachedDb = null;

async function connectToDatabase() {
  // Si ya estamos conectados, no hacemos nada
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  // Si hay una conexión en curso, esperamos a que termine
  if (mongoose.connection.readyState === 2) {
    return mongoose.connection;
  }

  console.info('Iniciando nueva conexión a MongoDB Atlas...');
  
  // Forzamos opciones que evitan el "buffering" infinito en serverless
  const opts = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
  };

  cachedDb = await mongoose.connect(MONGO_URI, opts);
  return cachedDb;
}

// Exportamos el handler asíncrono para Vercel
module.exports = async (req, res) => {
  try {
    // 1. Esperamos obligatoriamente a la base de datos
    await connectToDatabase();
    
    // 2. Una vez conectados, procesamos la petición con Express
    return app(req, res);
  } catch (error) {
    console.error('Error en el Handler de Vercel:', error);
    res.status(500).json({ 
      message: 'Error de conexión con la base de datos',
      error: error.message 
    });
  }
};