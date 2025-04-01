# Flight Booking System

A Node.js backend application for a flight booking system that allows users to search for flights, book tickets, and manage reservations.

## Features

- User Authentication with JWT
- Role-based access control (RBAC) for admin and regular users
- Flight search and booking
- Flight management (admin only)
- Flight rescheduling with seat availability tracking
- Redis caching for frequently searched flights
- Queue-based ticket processing with RabbitMQ
- Email notifications for booking confirmations, flight status updates, and reschedule requests

## Tech Stack

- Node.js & Express.js (Backend API)
- MySQL with Sequelize (Database)
- Redis (Caching)
- RabbitMQ (Message Queue)
- JWT Authentication
- Nodemailer (Email Service)
- Docker & Docker Compose (Containerization)
- Jest (Testing)

## Architecture

The application follows a service-oriented architecture with clear separation of concerns:

### Controllers

Controllers are responsible for handling HTTP requests and responses. They are thin and delegate business logic to services.

- `auth.controller.js` - Handles user authentication
- `flight.controller.js` - Handles flight operations
- `booking.controller.js` - Handles booking operations
- `reschedule.controller.js` - Handles flight rescheduling operations

### Services

Services contain the business logic of the application. They are responsible for data validation, business rules, and coordinating between different parts of the application.

- `auth.service.js` - Authentication business logic
- `flight.service.js` - Flight management business logic
- `booking.service.js` - Booking management business logic
- `reschedule.service.js` - Flight rescheduling business logic
- `cache.service.js` - Redis caching service
- `email.service.js` - Email notification service

### Models

Models represent the data structure and database schema.

- `User` - User model
- `Flight` - Flight model
- `Booking` - Booking model
- `RescheduleRequest` - Reschedule request model

### Middlewares

Middlewares handle cross-cutting concerns.

- `auth.middleware.js` - Authentication and authorization middleware
- `error.middleware.js` - Error handling middleware

## API Endpoints

### User Authentication

- `POST /api/register` - Register a new user
- `POST /api/login` - Authenticate user & return JWT

### Flight Management

- `GET /api/flights` - Fetch available flights
- `GET /api/flights/:id` - Get a specific flight
- `POST /api/flights` (Admin) - Add a new flight
- `PUT /api/flights/:id` (Admin) - Update flight details
- `DELETE /api/flights/:id` (Admin) - Delete a flight

### Booking & Notifications

- `POST /api/bookings` - Book a flight
- `GET /api/bookings` - Get all bookings for current user
- `GET /api/bookings/:id` - View booking details
- `POST /api/bookings/:id/cancel` - Cancel a booking
- `GET /api/admin/bookings` (Admin) - Get all bookings

### Flight Rescheduling

- `POST /api/reschedule` - Create a reschedule request
- `GET /api/reschedule` - Get all reschedule requests for current user
- `GET /api/reschedule/admin` (Admin) - Get all reschedule requests
- `POST /api/reschedule/:id/cancel` - Cancel a reschedule request
- `POST /api/reschedule/check-pending` (Admin) - Check for available seats for pending reschedule requests


## Setup Instructions

### Prerequisites

- Docker and Docker Compose
- Node.js (for local development)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd flight-booking-system
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   DB_HOST=mysql
   DB_PORT=3306
   DB_NAME=flight_booking_system
   DB_USER=root
   DB_PASSWORD=password
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRY=7d
   REDIS_HOST=redis
   REDIS_PORT=6379
   RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@example.com
   EMAIL_PASS=your_email_password
   NODE_ENV=development
   ```

3. Build and start the containers:
   ```
   docker-compose up --build   
   docker-compose down
   ```

4. The API will be available at `http://localhost:3000`

### Development with Hot Reloading

The application is configured with nodemon for hot reloading during development. When you make changes to the code, the server will automatically restart.

## Docker Setup

The application is containerized using Docker and Docker Compose. The following services are defined:

- `app` - Node.js application
- `mysql` - MySQL database
- `redis` - Redis cache
- `rabbitmq` - RabbitMQ message broker