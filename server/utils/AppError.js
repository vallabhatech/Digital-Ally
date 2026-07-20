export class AppError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Indicates it's a predicted operational error
    Error.captureStackTrace(this, this.constructor);
  }
}
