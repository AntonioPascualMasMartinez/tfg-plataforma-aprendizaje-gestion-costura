/**
 * @fileoverview Configuración principal de la aplicación Express y enrutamiento global.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: {
    code: 429,
    message: 'Límite de peticiones excedido. Intente de nuevo más tarde.',
  },
});
app.use('/api', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Servidor operativo y escuchando.' });
});

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Documentación API',
  })
);

app.use(errorHandler);

module.exports = app;