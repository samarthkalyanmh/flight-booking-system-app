const { Booking, Flight, RescheduleRequest, User } = require('../../models');
const { sequelize } = require('../../config/database');
const { sendToQueue } = require('../../config/rabbitmq');
const { Op } = require('sequelize');
const AppError = require('../../utils/AppError');


class RescheduleService {

  async createRescheduleRequest(requestData) {
    const { bookingId, userId, requestedFlightId, requestedSeatNumber } = requestData;
    
    // Start a transaction
    const transaction = await sequelize.transaction();
    let isRolledBack = false;
    
    try {
      // Check if booking exists and belongs to the user
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
        isRolledBack = true;
        throw new AppError(
          'Booking not found or does not belong to the user',
          404,
          AppError.TYPES.NOT_FOUND_ERROR
        );
      }
      
      // Check if booking is not already cancelled
      if (booking.status === 'cancelled') {
        await transaction.rollback();
        isRolledBack = true;
        throw new AppError(
          'Cannot reschedule a cancelled booking',
          400,
          AppError.TYPES.CONFLICT_ERROR
        );
      }
      
      // Check if requested flight exists
      const requestedFlight = await Flight.findByPk(requestedFlightId, { transaction });
      
      if (!requestedFlight) {
        await transaction.rollback();
        isRolledBack = true;
        throw new AppError(
          'Requested flight not found',
          404,
          AppError.TYPES.NOT_FOUND_ERROR
        );
      }
      
      // Check if there's already a pending reschedule request for this booking
      const existingRequest = await RescheduleRequest.findOne({
        where: {
          bookingId,
          status: 'pending'
        },
        transaction
      });
      
      if (existingRequest) {
        await transaction.rollback();
        isRolledBack = true;
        throw new AppError(
          'There is already a pending reschedule request for this booking',
          400,
          AppError.TYPES.CONFLICT_ERROR
        );
      }
      
      // Check if requested seat is available on the requested flight
      let isAvailable = false;
      let status = 'pending';
      
      if (requestedSeatNumber) {
        // Check if the specific seat is available
        const existingBooking = await Booking.findOne({
          where: {
            flightId: requestedFlightId,
            seatNumber: requestedSeatNumber,
            status: {
              [Op.notIn]: ['cancelled']
            }
          },
          transaction
        });
        
        isAvailable = !existingBooking && requestedFlight.availableSeats > 0;
      } else {
        // Just check if there are any available seats
        isAvailable = requestedFlight.availableSeats > 0;
      }
      
      // If seat is available, we can approve the request immediately
      if (isAvailable) {
        status = 'approved';
      }
      
      // Create reschedule request
      const rescheduleRequest = await RescheduleRequest.create({
        bookingId,
        userId,
        currentFlightId: booking.flightId,
        requestedFlightId,
        requestedSeatNumber,
        status,
        notificationSent: false
      }, { transaction });
      
      // If seat is available, process the reschedule immediately
      if (isAvailable) {
        // Update the booking with the new flight and seat
        const oldFlightId = booking.flightId;
        const oldSeatNumber = booking.seatNumber;
        
        booking.flightId = requestedFlightId;
        if (requestedSeatNumber) {
          booking.seatNumber = requestedSeatNumber;
        }
        
        await booking.save({ transaction });
        
        // Update available seats for both flights
        const oldFlight = await Flight.findByPk(oldFlightId, { transaction });
        oldFlight.availableSeats += 1;
        await oldFlight.save({ transaction });
        
        requestedFlight.availableSeats -= 1;
        await requestedFlight.save({ transaction });
        
        // Send notification for successful reschedule
        await sendToQueue('email_notifications', {
          type: 'reschedule_confirmation',
          bookingId: booking.id,
          userId: booking.userId,
          passengerEmail: booking.passengerEmail,
          passengerName: booking.passengerName,
          oldFlightDetails: {
            flightNumber: booking.flight.flightNumber,
            airline: booking.flight.airline,
            source: booking.flight.source,
            destination: booking.flight.destination,
            departureDate: booking.flight.departureDate,
            seatNumber: oldSeatNumber
          },
          newFlightDetails: {
            flightNumber: requestedFlight.flightNumber,
            airline: requestedFlight.airline,
            source: requestedFlight.source,
            destination: requestedFlight.destination,
            departureDate: requestedFlight.departureDate,
            seatNumber: requestedSeatNumber || booking.seatNumber
          }
        });
        
        rescheduleRequest.notificationSent = true;
        await rescheduleRequest.save({ transaction });
      }
      
      // Commit transaction
      await transaction.commit();
      
      return {
        rescheduleRequest,
        isProcessed: isAvailable
      };
    } catch (error) {
      // Rollback transaction in case of error
      if (!isRolledBack) {
        await transaction.rollback();
      }
      
      // If it's not an AppError, wrap it
      if (!error.statusCode) {
        throw new AppError(
          error.message || 'Error creating reschedule request',
          500,
          AppError.TYPES.SERVER_ERROR
        );
      }
      
      throw error;
    }
  }


  async checkPendingRescheduleRequests() {
    let processedCount = 0;
    
    try {
      // Get all pending reschedule requests
      const pendingRequests = await RescheduleRequest.findAll({
        where: {
          status: 'pending'
        },
        include: [
          {
            model: Booking,
            as: 'booking',
            include: [
              {
                model: Flight,
                as: 'flight'
              }
            ]
          },
          {
            model: Flight,
            as: 'requestedFlight'
          }
        ]
      });
      
      for (const request of pendingRequests) {
        // Start a transaction for each request
        const transaction = await sequelize.transaction();
        let isRolledBack = false;
        
        try {
          // Check if the requested seat is available
          let isAvailable = false;
          
          if (request.requestedSeatNumber) {
            // Check if the specific seat is available
            const existingBooking = await Booking.findOne({
              where: {
                flightId: request.requestedFlightId,
                seatNumber: request.requestedSeatNumber,
                status: {
                  [Op.notIn]: ['cancelled']
                }
              },
              transaction
            });
            
            isAvailable = !existingBooking && request.requestedFlight.availableSeats > 0;
          } else {
            // Just check if there are any available seats
            isAvailable = request.requestedFlight.availableSeats > 0;
          }
          
          if (isAvailable) {
            // Update the request status
            request.status = 'approved';
            request.notificationSent = true;
            await request.save({ transaction });
            
            // Update the booking with the new flight and seat
            const booking = request.booking;
            const oldFlightId = booking.flightId;
            const oldSeatNumber = booking.seatNumber;
            
            booking.flightId = request.requestedFlightId;
            if (request.requestedSeatNumber) {
              booking.seatNumber = request.requestedSeatNumber;
            }
            
            await booking.save({ transaction });
            
            // Update available seats for both flights
            const oldFlight = await Flight.findByPk(oldFlightId, { transaction });
            oldFlight.availableSeats += 1;
            await oldFlight.save({ transaction });
            
            const requestedFlight = await Flight.findByPk(request.requestedFlightId, { transaction });
            requestedFlight.availableSeats -= 1;
            await requestedFlight.save({ transaction });
            
            // Send notification for successful reschedule
            await sendToQueue('email_notifications', {
              type: 'reschedule_confirmation',
              bookingId: booking.id,
              userId: booking.userId,
              passengerEmail: booking.passengerEmail,
              passengerName: booking.passengerName,
              oldFlightDetails: {
                flightNumber: request.booking.flight.flightNumber,
                airline: request.booking.flight.airline,
                source: request.booking.flight.source,
                destination: request.booking.flight.destination,
                departureDate: request.booking.flight.departureDate,
                seatNumber: oldSeatNumber
              },
              newFlightDetails: {
                flightNumber: request.requestedFlight.flightNumber,
                airline: request.requestedFlight.airline,
                source: request.requestedFlight.source,
                destination: request.requestedFlight.destination,
                departureDate: request.requestedFlight.departureDate,
                seatNumber: request.requestedSeatNumber || booking.seatNumber
              }
            });
            
            processedCount++;
          }
          
          // Commit transaction
          await transaction.commit();
        } catch (error) {
          // Rollback transaction in case of error
          if (!isRolledBack) {
            await transaction.rollback();
          }
          console.error(`Error processing reschedule request ${request.id}:`, error);
        }
      }
      
      return processedCount;
    } catch (error) {
      console.error('Error checking pending reschedule requests:', error);
      return 0;
    }
  }

  async getUserRescheduleRequests(userId) {
    const requests = await RescheduleRequest.findAll({
      where: { userId },
      include: [
        {
          model: Booking,
          as: 'booking',
          include: [
            {
              model: Flight,
              as: 'flight'
            }
          ]
        },
        {
          model: Flight,
          as: 'requestedFlight'
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return requests;
  }

  async getAllRescheduleRequests() {
    const requests = await RescheduleRequest.findAll({
      include: [
        {
          model: Booking,
          as: 'booking',
          include: [
            {
              model: Flight,
              as: 'flight'
            }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Flight,
          as: 'currentFlight'
        },
        {
          model: Flight,
          as: 'requestedFlight'
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return requests;
  }


  async cancelRescheduleRequest(requestId, userId) {
    // Start a transaction
    const transaction = await sequelize.transaction();
    let isRolledBack = false;
    
    try {
      // Find reschedule request
      const request = await RescheduleRequest.findOne({
        where: {
          id: requestId,
          userId
        },
        transaction
      });
      
      if (!request) {
        await transaction.rollback();
        isRolledBack = true;
        throw new AppError(
          'Reschedule request not found or does not belong to the user',
          404,
          AppError.TYPES.NOT_FOUND_ERROR
        );
      }
      
      // Check if request is already processed
      if (request.status !== 'pending') {
        await transaction.rollback();
        isRolledBack = true;
        throw new AppError(
          `Cannot cancel a reschedule request with status: ${request.status}`,
          400,
          AppError.TYPES.CONFLICT_ERROR
        );
      }
      
      // Update request status
      request.status = 'cancelled';
      await request.save({ transaction });
      
      // Commit transaction
      await transaction.commit();
      
      return request;
    } catch (error) {
      // Rollback transaction in case of error
      if (isRolledBack) {
        await transaction.rollback();
      }
      
      // If it's not an AppError, wrap it
      if (!error.statusCode) {
        throw new AppError(
          error.message || 'Error cancelling reschedule request',
          500,
          AppError.TYPES.SERVER_ERROR
        );
      }
      
      throw error;
    }
  }
}

module.exports = new RescheduleService();
