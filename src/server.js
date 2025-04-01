const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Importing configs
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { connectRabbitMQ } = require('./config/rabbitmq');
const { verifyTransporter } = require('./config/email');

// Importing routes and middleware
const routes = require('./routes');
const { errorHandler } = require('./middlewares');

// Importing services
const { emailService, rescheduleService } = require('./services');

// Initialize express app
const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use(routes);

// Error handling middleware
app.use(errorHandler);

const initializeServices = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Database connected successfully');
    
    // Connect to Redis
    await connectRedis();
    console.log('Redis connected successfully');
    
    // Connect to RabbitMQ
    await connectRabbitMQ();
    console.log('RabbitMQ connected successfully');
    
    // Verify email transporter
    const emailVerified = await verifyTransporter();
    if (!emailVerified) {
      console.warn('Email service is not configured correctly. Email notifications will not be sent.');
      console.warn('This will not prevent the application from starting, but email functionality will be limited.');
    }
    
    // Start email notification service
    try {
      await emailService.processEmailNotifications();
      console.log('Email notification service started successfully');
    } catch (emailError) {
      console.warn('Failed to start email notification service:', emailError.message);
      console.warn('Email notifications will not be processed, but the application will continue to run.');
    }
    
    // Set up scheduled job to check for pending reschedule requests
    setupRescheduleChecker();
    
    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
};

/**
 * Set up scheduled job to check for pending reschedule requests
 * Every 5 minutes
 */
const setupRescheduleChecker = () => {
  console.log('Setting up scheduled job to check for pending reschedule requests');
  
  // Check immediately on servar start
  rescheduleService.checkPendingRescheduleRequests()
    .then(count => {
      console.log(`Initial check: Processed ${count} pending reschedule requests`);
    })
    .catch(error => {
      console.error('Error checking pending reschedule requests:', error);
    });
  
  // Every 5 minutes
  setInterval(() => {
    rescheduleService.checkPendingRescheduleRequests()
      .then(count => {
        if (count > 0) {
          console.log(`Scheduled check: Processed ${count} pending reschedule requests`);
        }
      })
      .catch(error => {
        console.error('Error checking pending reschedule requests:', error);
      });
  }, 5 * 60 * 1000); // 5 minutes
};

// Initialize services
initializeServices();

module.exports = app;
