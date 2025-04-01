const express = require('express');
const authRoutes = require('./auth.routes');
const flightRoutes = require('./flight.routes');
const bookingRoutes = require('./booking.routes');
const rescheduleRoutes = require('./reschedule.routes');

const router = express.Router();

// Routes
router.use('/api', authRoutes);
router.use('/api/flights', flightRoutes);
router.use('/api', bookingRoutes);
router.use('/api/reschedule', rescheduleRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// For unknown routes
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The requested path '${req.originalUrl}' was not found on this server.`
  });
});

module.exports = router;
