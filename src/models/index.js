const User = require('./user.model');
const Flight = require('./flight.model');
const Booking = require('./booking.model');
const RescheduleRequest = require('./rescheduleRequest.model');

// Define relationships
User.hasMany(Booking, {
  foreignKey: 'userId',
  as: 'bookings',
  onDelete: 'CASCADE'
});

Booking.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Flight.hasMany(Booking, {
  foreignKey: 'flightId',
  as: 'bookings',
  onDelete: 'CASCADE'
});

Booking.belongsTo(Flight, {
  foreignKey: 'flightId',
  as: 'flight'
});

// Reschedule Request relationships
User.hasMany(RescheduleRequest, {
  foreignKey: 'userId',
  as: 'rescheduleRequests',
  onDelete: 'CASCADE'
});

RescheduleRequest.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Booking.hasMany(RescheduleRequest, {
  foreignKey: 'bookingId',
  as: 'rescheduleRequests',
  onDelete: 'CASCADE'
});

RescheduleRequest.belongsTo(Booking, {
  foreignKey: 'bookingId',
  as: 'booking'
});

Flight.hasMany(RescheduleRequest, {
  foreignKey: 'currentFlightId',
  as: 'currentFlightRescheduleRequests',
  onDelete: 'CASCADE'
});

RescheduleRequest.belongsTo(Flight, {
  foreignKey: 'currentFlightId',
  as: 'currentFlight'
});

Flight.hasMany(RescheduleRequest, {
  foreignKey: 'requestedFlightId',
  as: 'requestedFlightRescheduleRequests',
  onDelete: 'CASCADE'
});

RescheduleRequest.belongsTo(Flight, {
  foreignKey: 'requestedFlightId',
  as: 'requestedFlight'
});

module.exports = {
  User,
  Flight,
  Booking,
  RescheduleRequest
};
