/**
 * Request Logger Middleware
 * Logs all incoming API requests for monitoring and debugging
 */

import { Request, Response, NextFunction } from 'express';
import { createLogger } from '@utils/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('RequestLogger');

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // Generate request ID
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  (req as any).id = requestId;

  // Start time for duration calculation
  const startTime = Date.now();

  // Log request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    user: (req as any).user?.id
  });

  // Capture response
  const originalSend = res.send;
  res.send = function(data: any) {
    res.send = originalSend;
    
    // Calculate duration
    const duration = Date.now() - startTime;

    // Log response
    logger.info('Outgoing response', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      user: (req as any).user?.id
    });

    return res.send(data);
  };

  next();
}