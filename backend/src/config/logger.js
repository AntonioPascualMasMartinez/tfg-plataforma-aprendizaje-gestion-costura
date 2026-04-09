/**
 * @fileoverview Configuración del sistema de logging centralizado utilizando Winston.
 */
const winston = require('winston');
const { format, transports } = winston;

const baseFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(baseFormat, format.json()),
  defaultMeta: { service: 'costura-api' },
  transports: [
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(
          (info) =>
            `[${info.timestamp}] ${info.level}: ${info.message} ${info.stack ? '\n' + info.stack : ''}`,
        ),
      ),
    }),
  );
}

module.exports = logger;
