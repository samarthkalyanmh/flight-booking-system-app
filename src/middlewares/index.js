const { errorHandler } = require('./error.middleware');
const { authMiddleware, adminMiddleware } = require('./auth.middleware');

module.exports = {
  errorHandler,
  authMiddleware,
  adminMiddleware
};
