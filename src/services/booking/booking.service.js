const { Booking, Flight, User } = require('../../models');
const { sequelize } = require('../../config/database');
const { sendToQueue } = require('../../config/rabbitmq');
const { Op } = require('sequelize');
const flightService = require('../flight/flight.service');
const AppError = require('../../utils/AppError');
const { validateBookingData } = require('../../utils/validators');

class BookingService {

  async bookFlight(bookingData) {
    const { userId, flightId, seatNumber, passengerName, passengerEmail, passengerPhone } = bookingData;
    
    // Validate booking data
    validateBookingData({
      flightId,
      seatNumber,
      passengerName,
      passengerEmail,
      passengerPhone
    });
    
    // Start a transaction
    const transaction = await sequelize.transaction();
    
    try {
      // Check if flight exists
      const flight = await Flight.findByPk(flightId, { transaction });
      
      if (!flight) {
        await transaction.rollback();
        throw new AppError(
          'Flight not found',
          404,
          AppError.TYPES.NOT_FOUND_ERROR
        );
      }
      
      // Check if flight has available seats
      if (flight.availableSeats <= 0) {
        await transaction.rollback();
        throw new AppError(
          'No available seats on this flight',
          400,
          AppError.TYPES.CONFLICT_ERROR
        );
      }
      
      // Check if seat is already booked
      const existingBooking = await Booking.findOne({
        where: {
          flightId,
          seatNumber,
          status: {
            [Op.notIn]: ['cancelled']
          }
        },
        transaction
      });
      
      if (existingBooking) {
        await transaction.rollback();
        throw new AppError(
          'This seat is already booked',
          400,
          AppError.TYPES.CONFLICT_ERROR
        );
      }
      
      // Create booking
      const booking = await Booking.create({
        userId,
        flightId,
        seatNumber,
        status: 'pending',
        paymentStatus: 'pending',
        paymentAmount: flight.price,
        passengerName,
        passengerEmail,
        passengerPhone
      }, { transaction });
      
      // Update available seats
      await flightService.updateAvailableSeats(flightId, -1, transaction);
      
      // Commit transaction
      await transaction.commit();
      
      // Send confirmation email via queue
      await this.sendBookingConfirmationEmail(booking, flight);
      
      return booking;
    } catch (error) {
      // Rollback transaction in case of error
      if (transaction && transaction.finished !== 'commit') {
        await transaction.rollback();
      }
      
      // If it's not an AppError, wrap it
      if (!error.statusCode) {
        throw new AppError(
          error.message || 'Error booking flight',
          500,
          AppError.TYPES.SERVER_ERROR
        );
      }
      
      throw error;
    }
  }


  async getUserBookings(userId) {
    if (!userId) {
      throw new AppError(
        'User ID is required',
        400,
        AppError.TYPES.VALIDATION_ERROR
      );
    }
    
    const bookings = await Booking.findAll({
      where: { userId },
      include: [
        {
          model: Flight,
          as: 'flight'
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return bookings;
  }

  async getAllBookings() {
    const bookings = await Booking.findAll({
      include: [
        {
          model: Flight,
          as: 'flight'
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return bookings;
  }


  async getUserBookingById(bookingId, userId) {
    if (!bookingId || !userId) {
      throw new AppError(
        'Booking ID and User ID are required',
        400,
        AppError.TYPES.VALIDATION_ERROR
      );
    }
    
    const booking = await Booking.findOne({
      where: {
        id: bookingId,
        userId
      },
      include: [
        {
          model: Flight,
          as: 'flight'
        }
      ]
    });
    
    if (!booking) {
      throw new AppError(
        'Booking not found',
        404,
        AppError.TYPES.NOT_FOUND_ERROR
      );
    }
    
    return booking;
  }


  async cancelBooking(bookingId, userId) {
    if (!bookingId || !userId) {
      throw new AppError(
        'Booking ID and User ID are required',
        400,
        AppError.TYPES.VALIDATION_ERROR
      );
    }
    
    // Start a transaction
    const transaction = await sequelize.transaction();
    
    try {
      // Find booking
      const booking = await Booking.findOne({
        where: {
          id: bookingId,
          userId
        },
        include: [
          {
            model: Flight,
            as: 'flight'
          }
        ],
        transaction
      });
      
      if (!booking) {
        await transaction.rollback();
        throw new AppError(
          'Booking not found',
          404,
          AppError.TYPES.NOT_FOUND_ERROR
        );
      }
      
      // Check if booking is already cancelled
      if (booking.status === 'cancelled') {
        await transaction.rollback();
        throw new AppError(
          'Booking is already cancelled',
          400,
          AppError.TYPES.CONFLICT_ERROR
        );
      }
      
      // Update booking status
      booking.status = 'cancelled';
      booking.paymentStatus = 'refunded';
      await booking.save({ transaction });
      
      // Update flight available seats
      await flightService.updateAvailableSeats(booking.flightId, 1, transaction);
      
      // Commit transaction
      await transaction.commit();
      
      // Send cancellation email via queue
      await this.sendBookingCancellationEmail(booking);
      
      return booking;
    } catch (error) {
      // Rollback transaction in case of error
      if (transaction && transaction.finished !== 'commit') {
        await transaction.rollback();
      }
      
      // If it's not an AppError, wrap it
      if (!error.statusCode) {
        throw new AppError(
          error.message || 'Error cancelling booking',
          500,
          AppError.TYPES.SERVER_ERROR
        );
      }
      
      throw error;
    }
  }


  async sendBookingConfirmationEmail(booking, flight) {
    try {
      await sendToQueue('email_notifications', {
        type: 'booking_confirmation',
        bookingId: booking.id,
        userId: booking.userId,
        flightId: booking.flightId,
        passengerEmail: booking.passengerEmail,
        passengerName: booking.passengerName,
        seatNumber: booking.seatNumber,
        flightDetails: {
          flightNumber: flight.flightNumber,
          airline: flight.airline,
          source: flight.source,
          destination: flight.destination,
          departureDate: flight.departureDate,
          arrivalDate: flight.arrivalDate
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error sending booking confirmation email:', error);
      return false;
    }
  }


  async sendBookingCancellationEmail(booking) {
    try {
      const flight = booking.flight;
      
      await sendToQueue('email_notifications', {
        type: 'booking_cancellation',
        bookingId: booking.id,
        userId: booking.userId,
        passengerEmail: booking.passengerEmail,
        passengerName: booking.passengerName,
        flightDetails: {
          flightNumber: flight.flightNumber,
          airline: flight.airline,
          source: flight.source,
          destination: flight.destination,
          departureDate: flight.departureDate
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error sending booking cancellation email:', error);

      return false;
    }
  }
}

module.exports = new BookingService();
