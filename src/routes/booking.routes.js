const express = require('express');
const { bookingController } = require('../controllers');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// User Routes
router.post('/bookings', authenticate, bookingController.bookFlight);
router.get('/bookings/:id', authenticate, bookingController.getBooking);
router.post('/bookings/:id/cancel', authenticate, bookingController.cancelBooking);


router.get('/bookings', authenticate, bookingController.getMyBookings);

// Admin only routes
router.get('/admin/bookings', authenticate, authorize(['admin']), bookingController.getAllBookings);

module.exports = router;
