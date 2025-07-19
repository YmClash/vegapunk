import winston from 'winston';
import path from 'path';

const logLevel = process.env.LOG_LEVEL ?? 'info';
const logFormat = process.env.LOG_FORMAT ?? 'json';

const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.metadata({
    fillExcept: ['message', 'level', 'timestamp', 'label'],
  }),
);

const jsonFormat = winston.format.combine(customFormat, winston.format.json());

const prettyFormat = winston.format.combine(
  customFormat,
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, metadata }) => {
    const meta = Object.keys(metadata).length > 0 ? JSON.stringify(metadata, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${meta}`;
  }),
);

export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat === 'json' ? jsonFormat : prettyFormat,
  defaultMeta: { service: 'vegapunk-agentic' },
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  );
  
  logger.add(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  );
}

// Create child loggers for specific modules
export function createLogger(module: string): winston.Logger {
  return logger.child({ module });
}