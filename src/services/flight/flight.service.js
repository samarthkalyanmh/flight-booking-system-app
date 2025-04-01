const { Flight } = require('../../models');
const { Op } = require('sequelize');
const { redisClient } = require('../../config/redis');
const AppError = require('../../utils/AppError');
const { validateFlightData } = require('../../utils/validators');


class FlightService {

  async getFlights(filters = {}) {
    // filters = {}
    console.log('HEREEEEEEEEEEEE', filters)
    const { source, destination, date, airline } = filters;
    
    // Build filter object
    const filter = {};
    
    if (source) {
      filter.source = { [Op.like]: `%${source}%` };
    }
    
    if (destination) {
      filter.destination = { [Op.like]: `%${destination}%` };
    }
    
    if (date) {
      // If date is provided, find flights on that date
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      filter.departureDate = {
        [Op.gte]: searchDate,
        [Op.lt]: nextDay
      };
    }
    
    if (airline) {
      filter.airline = { [Op.like]: `%${airline}%` };
    }
    
    // Add condition for available flights only
    filter.availableSeats = { [Op.gt]: 0 };
    filter.status = { [Op.ne]: 'cancelled' };
    
    // Try to get from cache first
    // const cacheKey = `flights:${JSON.stringify(filter)}`;
    const cacheKey = `flights:${JSON.stringify(filters)}`;
    const cachedFlights = await redisClient.get(cacheKey);
    
    if (cachedFlights) {
      return {
        flights: JSON.parse(cachedFlights),
        fromCache: true
      };
    }
    
    // If not in cache, fetch from database
    const flights = await Flight.findAll({
      where: filter,
      order: [['departureDate', 'ASC']]
    });
    
    // Store in cache for 10 minutes
    await redisClient.set(cacheKey, JSON.stringify(flights), {
      EX: 600
    });
    
    return {
      flights,
      fromCache: false
    };
  }


  async getFlightById(flightId) {
    const flight = await Flight.findByPk(flightId);
    
    if (!flight) {
      throw new AppError(
        'Flight not found',
        404,
        AppError.TYPES.NOT_FOUND_ERROR
      );
    }
    
    return flight;
  }

  async createFlight(flightData) {
    try {
      validateFlightData(flightData);
      
      if (!flightData.availableSeats) {
        flightData.availableSeats = flightData.totalSeats;
      }
      
      if (!flightData.status) {
        flightData.status = 'scheduled';
      }
      
      const flight = await Flight.create(flightData);
      
      await this.clearFlightCache();
      
      return flight;
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        throw new AppError(
          error.errors.map(e => e.message).join(', '),
          400,
          AppError.TYPES.VALIDATION_ERROR
        );
      }
      throw error;
    }
  }


  async updateFlight(flightId, flightData) {
    const flight = await Flight.findByPk(flightId);
    
    if (!flight) {
      throw new AppError(
        'Flight not found',
        404,
        AppError.TYPES.NOT_FOUND_ERROR
      );
    }
    
    try {
      if (flightData.totalSeats && flightData.totalSeats !== flight.totalSeats) {
        const seatDifference = flightData.totalSeats - flight.totalSeats;
        flightData.availableSeats = flight.availableSeats + seatDifference;
        
        if (flightData.availableSeats < 0) {
          throw new AppError(
            'Cannot reduce total seats below the number of booked seats',
            400,
            AppError.TYPES.VALIDATION_ERROR
          );
        }
      }
      await this.clearFlightCache();
      
      return flight;
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        throw new AppError(
          error.errors.map(e => e.message).join(', '),
          400,
          AppError.TYPES.VALIDATION_ERROR
        );
      }
      throw error;
    }
  }


  async deleteFlight(flightId) {
    const flight = await Flight.findByPk(flightId);
    
    if (!flight) {
      throw new AppError(
        'Flight not found',
        404,
        AppError.TYPES.NOT_FOUND_ERROR
      );
    }
    
    const bookings = await flight.getBookings();
    if (bookings.length > 0) {
      throw new AppError(
        'Cannot delete flight with existing bookings',
        400,
        AppError.TYPES.CONFLICT_ERROR
      );
    }
    
    await flight.destroy();
    
    await this.clearFlightCache();
    
    return true;
  }


  async clearFlightCache() {
    const keys = await redisClient.keys('flights:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  }

  // Update flight available seats

  async updateAvailableSeats(flightId, change, transaction) {
    const flight = await Flight.findByPk(flightId, { transaction });
    
    if (!flight) {
      throw new AppError(
        'Flight not found',
        404,
        AppError.TYPES.NOT_FOUND_ERROR
      );
    }
    
    // Ensure available seats doesn't go below 0 or above total seats
    const newAvailableSeats = flight.availableSeats + change;
    if (newAvailableSeats < 0) {
      throw new AppError(
        'No available seats on this flight',
        400,
        AppError.TYPES.CONFLICT_ERROR
      );
    }
    
    if (newAvailableSeats > flight.totalSeats) {
      throw new AppError(
        'Available seats cannot exceed total seats',
        400,
        AppError.TYPES.VALIDATION_ERROR
      );
    }
    
    flight.availableSeats = newAvailableSeats;
    await flight.save({ transaction });
    
    return flight;
  }
}

module.exports = new FlightService();
