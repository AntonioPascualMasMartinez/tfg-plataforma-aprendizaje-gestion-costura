/**
 * @fileoverview Configuración del sistema de logging centralizado adaptada para Vercel.
 */
const winston = require('winston');
const { format, transports } = winston;

const baseFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
);

// 1. Inicializamos el logger SOLO con la Consola (compatible con Vercel)
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(baseFormat, format.json()),
  defaultMeta: { service: 'costura-api' },
  transports: [
    new transports.Console({
      format:
        process.env.NODE_ENV === 'production'
          ? format.json() // En producción (Vercel) usamos JSON para mejor lectura de logs
          : format.combine(
              format.colorize(),
              format.printf(
                (info) =>
                  `[${info.timestamp}] ${info.level}: ${info.message} ${info.stack ? '\n' + info.stack : ''}`,
              ),
            ),
    }),
  ],
});

// 2. Solo si NO estamos en producción, intentamos usar el sistema de archivos
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.File({ filename: 'logs/error.log', level: 'error' }));
  logger.add(new transports.File({ filename: 'logs/combined.log' }));
}

module.exports = logger;
