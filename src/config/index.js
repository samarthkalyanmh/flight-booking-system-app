const { sequelize, connectDB } = require('./database');
const { redisClient, connectRedis } = require('./redis');
const { connectRabbitMQ, createQueue, sendToQueue, consumeQueue } = require('./rabbitmq');
const { generateToken, verifyToken } = require('./jwt');
const { transporter, verifyTransporter, sendEmail } = require('./email');

module.exports = {
  sequelize,
  connectDB,
  
  redisClient,
  connectRedis,
  
  connectRabbitMQ,
  createQueue,
  sendToQueue,
  consumeQueue,
  
  // JWT
  generateToken,
  verifyToken,
  
  // Email
  transporter,
  verifyTransporter,
  sendEmail
};
