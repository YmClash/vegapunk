/**
 * Error Handler Middleware
 * Centralized error handling for REST API
 */

import { Request, Response, NextFunction } from 'express';
import { createLogger } from '@utils/logger';

const logger = createLogger('ErrorHandler');

export interface APIError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

export function errorHandler(
  err: APIError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error details
  logger.error('API Error:', {
    message: err.message,
    stack: err.stack,
    status: err.status,
    code: err.code,
    url: req.url,
    method: req.method,
    ip: req.ip,
    user: (req as any).user?.id
  });

  // Default error values
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';

  // Send error response
  res.status(status).json({
    success: false,
    error: {
      message,
      code,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    },
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.details
    })
  });
}