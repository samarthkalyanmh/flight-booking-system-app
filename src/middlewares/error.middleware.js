const AppError = require('../utils/AppError');


const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let type = err.type || AppError.TYPES.SERVER_ERROR;
  
  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    message = err.errors.map(e => e.message).join(', ');
    type = AppError.TYPES.VALIDATION_ERROR;
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    type = AppError.TYPES.AUTHENTICATION_ERROR;
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    type = AppError.TYPES.AUTHENTICATION_ERROR;
  }
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    type,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = {
  errorHandler
};
