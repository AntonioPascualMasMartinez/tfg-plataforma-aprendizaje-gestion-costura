const winston = require('winston');
const { format, transports } = winston;

// Formato base común: Timestamp y manejo de trazas de error (stack trace)
const baseFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat()
);

// Creación de la instancia del Logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(baseFormat, format.json()), // JSON para producción
  defaultMeta: { service: 'costura-api' },
  transports: [
    // RNF18: Registro basado en archivos para auditoría
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ],
});

// Si no estamos en producción, añadimos salida por consola más amigable
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.colorize(), // Colores legibles en terminal local
        format.printf(
          (info) => `[${info.timestamp}] ${info.level}: ${info.message} ${info.stack ? '\n' + info.stack : ''}`
        )
      ),
    })
  );
}

module.exports = logger;