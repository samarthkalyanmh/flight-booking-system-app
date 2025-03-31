const authService = require('./auth/auth.service');
const flightService = require('./flight/flight.service');
const bookingService = require('./booking/booking.service');
const rescheduleService = require('./booking/reschedule.service');
const cacheService = require('./cache.service');
const emailService = require('./email.service');

module.exports = {
  authService,
  flightService,
  bookingService,
  rescheduleService,
  cacheService,
  emailService
};
