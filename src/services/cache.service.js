const { redisClient } = require('../config/redis');
const { Flight } = require('../models');
const { Op } = require('sequelize');

class CacheService {

  static async cacheFlightById(flightId, flightData, ttl = 3600) {
    try {
      const cacheKey = `flight:${flightId}`;
      await redisClient.set(cacheKey, JSON.stringify(flightData), {
        EX: ttl
      });
      console.log(`Cached flight with ID: ${flightId}`);
      return true;
    } catch (error) {
      console.error('Error caching flight:', error);
      return false;
    }
  }


  static async getFlightById(flightId) {
    try {
      const cacheKey = `flight:${flightId}`;
      const cachedFlight = await redisClient.get(cacheKey);
      
      if (cachedFlight) {
        console.log(`Retrieved flight with ID: ${flightId} from cache`);
        return JSON.parse(cachedFlight);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting flight from cache:', error);
      return null;
    }
  }


  static async cacheFlightsBySearch(criteria, flights, ttl = 600) {
    try {
      const cacheKey = `flights:${JSON.stringify(criteria)}`;
      await redisClient.set(cacheKey, JSON.stringify(flights), {
        EX: ttl
      });
      console.log(`Cached flights for search criteria: ${JSON.stringify(criteria)}`);
      return true;
    } catch (error) {
      console.error('Error caching flights by search:', error);
      return false;
    }
  }


  static async getFlightsBySearch(criteria) {
    try {
      const cacheKey = `flights:${JSON.stringify(criteria)}`;
      const cachedFlights = await redisClient.get(cacheKey);
      
      if (cachedFlights) {
        console.log(`Retrieved flights for search criteria: ${JSON.stringify(criteria)} from cache`);
        return JSON.parse(cachedFlights);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting flights from cache:', error);
      return null;
    }
  }

  static async invalidateFlightCache(flightId) {
    try {
      const cacheKey = `flight:${flightId}`;
      await redisClient.del(cacheKey);
      
      const searchKeys = await redisClient.keys('flights:*');
      if (searchKeys.length > 0) {
        await redisClient.del(searchKeys);
      }
      
      console.log(`Invalidated cache for flight with ID: ${flightId}`);
      return true;
    } catch (error) {
      console.error('Error invalidating flight cache:', error);
      return false;
    }
  }

  static async invalidateAllFlightCaches() {
    try {
      const keys = await redisClient.keys('flight:*');
      const searchKeys = await redisClient.keys('flights:*');
      
      const allKeys = [...keys, ...searchKeys];
      
      if (allKeys.length > 0) {
        await redisClient.del(allKeys);
        console.log(`Invalidated ${allKeys.length} flight cache entries`);
      }
      
      return true;
    } catch (error) {
      console.error('Error invalidating all flight caches:', error);
      return false;
    }
  }


  static async prefetchPopularFlights() {
    try {
      console.log('Prefetching popular flights...');
      
      const popularFlights = await Flight.findAll({
        where: {
          status: 'scheduled',
          availableSeats: { [Op.gt]: 0 }
        },
        order: [['createdAt', 'DESC']],
        limit: 20
      });
      
      for (const flight of popularFlights) {
        await CacheService.cacheFlightById(flight.id, flight, 3600); 
      }
      
      console.log(`Prefetched and cached ${popularFlights.length} popular flights`);
      return true;
    } catch (error) {
      console.error('Error prefetching popular flights:', error);
      return false;
    }
  }
}

module.exports = CacheService;
