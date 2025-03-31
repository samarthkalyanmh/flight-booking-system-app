const authController = require('./auth.controller');
const flightController = require('./flight.controller');
const bookingController = require('./booking.controller');
const rescheduleController = require('./reschedule.controller');

module.exports = {
  authController,
  flightController,
  bookingController,
  rescheduleController
};
