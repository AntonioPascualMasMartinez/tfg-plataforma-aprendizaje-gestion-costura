const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan'); // Descomentar cuando configures Morgan
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();

// 1. Middlewares de Seguridad y Cabeceras (RNF15, RNF16)
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200', // Origen de la SPA (Angular)
    credentials: true, // Crucial para aceptar cookies httpOnly (Refresh Tokens)
  }),
);

// 2. Limitador de peticiones general (Prevención DDoS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 peticiones por IP por ventana
  message: {
    code: 429,
    message: 'Demasiadas peticiones desde esta IP, intente de nuevo más tarde.',
  },
});
app.use('/api', limiter);

// 3. Middlewares de Parseo de Body y Cookies
app.use(express.json()); // Parseo de JSON payloads
app.use(express.urlencoded({ extended: true })); // Parseo de datos x-www-form-urlencoded
app.use(cookieParser()); // Parseo de Cookies para extraer el Refresh Token

// 4. Montaje de Rutas Maestras (Vertical Slices)

const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/user.routes');
const uploadRoutes = require('./modules/uploads/upload.routes');
const projectRoutes = require('./modules/projects/project.routes');
const tutorialRoutes = require('./modules/tutorials/tutorial.routes');
const communityRoutes = require('./modules/community/community.routes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tutorials', tutorialRoutes);
app.use('/api/v1/community', communityRoutes);

// Endpoint de verificación rápida (Healthcheck)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Servidor operativo y escuchando.' });
});

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Documentación API - Costura',
  }),
);

// 5. Middleware Global de Manejo de Errores (Siempre debe ir al final)
const errorHandler = require('./middlewares/error.middleware');
app.use(errorHandler);

// Exportamos la instancia pura, facilitando las pruebas de integración con Supertest
module.exports = app;
