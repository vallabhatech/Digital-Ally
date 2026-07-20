import { logger } from '../logger.js';
import { AppError } from '../utils/AppError.js';

export function errorHandler(err, req, res, next) {
  let error = err;

  if (!(error instanceof AppError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new AppError(statusCode, 'SERVER_ERROR', message);
    error.isOperational = false;
  }

  // Log error using our centralized logger
  if (error.isOperational) {
    logger.warn(`Operational Error: [${error.code}] ${error.message}`, {
      path: req.path,
      method: req.method,
      details: error.details,
    });
  } else {
    logger.error(`Programming Error: ${err.message}`, {
      path: req.path,
      method: req.method,
      stack: err.stack,
    });
  }

  res.status(error.statusCode).json({
    data: null,
    meta: null,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
      ...(process.env.NODE_ENV === 'development' && !error.isOperational ? { stack: err.stack } : {}),
    },
  });
}
