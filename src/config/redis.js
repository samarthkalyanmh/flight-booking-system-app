const redis = require('redis');
require('dotenv').config();

// // Create Redis client
// const redisClient = redis.createClient({
//   // host: process.env.REDIS_HOST,
//   // port: process.env.REDIS_PORT
//   host: process.env.REDIS_HOST || '127.0.0.1',
//   port: process.env.REDIS_PORT || 6379,
// });

const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    family: 4, // Force IPv4 connection
  },
});

const connectRedis = async () => {
  try {
    console.log('LLLLLLLLLLLLLLLLLLLLLL', process.env.REDIS_HOST, process.env.REDIS_PORT)
    await redisClient.connect();
    console.log('Redis client connected');

    // Handle Redis errors
    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await redisClient.quit();
      console.log('Redis connection closed due to app termination');
    });

    return redisClient;
  } catch (error) {
    console.error('Unable to connect to Redis:', error);
    process.exit(1);
  }
};

module.exports = {
  redisClient,
  connectRedis
};
