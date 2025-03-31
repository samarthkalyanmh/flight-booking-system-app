const { rescheduleService } = require('../services/booking/reschedule.service');
const { formatSuccess, formatError } = require('../utils/responseFormatter');
const AppError = require('../utils/AppError');

// Create a reschedule request

exports.createRescheduleRequest = async (req, res, next) => {
  try {
    const { bookingId, requestedFlightId, requestedSeatNumber } = req.body;
    const userId = req.user.id;
    
    if (!bookingId || !requestedFlightId) {
      throw new AppError(
        'Booking ID and requested flight ID are required',
        400,
        AppError.TYPES.VALIDATION_ERROR
      );
    }
    
    const result = await rescheduleService.createRescheduleRequest({
      bookingId,
      userId,
      requestedFlightId,
      requestedSeatNumber
    });
    
    const message = result.isProcessed
      ? 'Flight rescheduled successfully'
      : 'Reschedule request created successfully. You will be notified when a seat becomes available.';
    
    const response = formatSuccess(message, result, 201);
    res.status(response.statusCode).json(response.body);
  } catch (error) {
    next(error);
  }
};

// Get all reschedule requests for the current user

exports.getUserRescheduleRequests = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const requests = await rescheduleService.getUserRescheduleRequests(userId);
    
    const response = formatSuccess('Reschedule requests retrieved successfully', requests);
    res.status(response.statusCode).json(response.body);
  } catch (error) {
    next(error);
  }
};

// Get all reschedule requests (admin only)

exports.getAllRescheduleRequests = async (req, res, next) => {
  try {
    const requests = await rescheduleService.getAllRescheduleRequests();
    
    const response = formatSuccess('All reschedule requests retrieved successfully', requests);
    res.status(response.statusCode).json(response.body);
  } catch (error) {
    next(error);
  }
};

// Cancel a reschedule request

exports.cancelRescheduleRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    if (!id) {
      throw new AppError(
        'Reschedule request ID is required',
        400,
        AppError.TYPES.VALIDATION_ERROR
      );
    }
    
    const request = await rescheduleService.cancelRescheduleRequest(id, userId);
    
    const response = formatSuccess('Reschedule request cancelled successfully', request);
    res.status(response.statusCode).json(response.body);
  } catch (error) {
    next(error);
  }
};

// Check for available seats for pending reschedule requests

exports.checkPendingRescheduleRequests = async (req, res, next) => {
  try {
    const processedCount = await rescheduleService.checkPendingRescheduleRequests();
    
    const response = formatSuccess(
      `Processed ${processedCount} pending reschedule requests`,
      { processedCount }
    );
    res.status(response.statusCode).json(response.body);
  } catch (error) {
    next(error);
  }
};
