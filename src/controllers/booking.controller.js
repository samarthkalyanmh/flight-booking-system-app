const bookingService = require('../services/booking/booking.service');


exports.bookFlight = async (req, res, next) => {
  try {
    const { flightId, seatNumber, passengerName, passengerEmail, passengerPhone } = req.body;
    
    const booking = await bookingService.bookFlight({
      userId: req.user.id,
      flightId,
      seatNumber,
      passengerName,
      passengerEmail,
      passengerPhone
    });
    
    res.status(201).json({
      success: true,
      message: 'Flight booked successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};


exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await bookingService.getUserBookings(req.user.id);
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};


exports.getAllBookings = async (req, res, next) => {
  try {
    const bookings = await bookingService.getAllBookings();
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

exports.getBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.getUserBookingById(req.params.id, req.user.id);
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
 
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.cancelBooking(req.params.id, req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
