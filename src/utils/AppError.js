// Custom error class for application errors which allows setting status code and error type

class AppError extends Error {

  constructor(message, statusCode = 500, type = 'server_error') {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.isOperational = true; // Indicates this is an operational error, not a programming error
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error types
AppError.TYPES = {
  VALIDATION_ERROR: 'validation_error',
  AUTHENTICATION_ERROR: 'authentication_error',
  AUTHORIZATION_ERROR: 'authorization_error',
  NOT_FOUND_ERROR: 'not_found_error',
  CONFLICT_ERROR: 'conflict_error',
  SERVER_ERROR: 'server_error'
};

module.exports = AppError;
