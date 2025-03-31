const AppError = require('./AppError');

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};


const isStrongPassword = (password) => {
  
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/; // Regex for at least 8 characters, 1 uppercase, 1 lowercase, 1 number 
  return passwordRegex.test(password);
};

const validateUserRegistration = (userData) => {
  const { name, email, password } = userData;
  
  if (!name || !email || !password) {
    throw new AppError(
      'Name, email, and password are required',
      400,
      AppError.TYPES.VALIDATION_ERROR
    );
  }
  
  if (!isValidEmail(email)) {
    throw new AppError(
      'Invalid email format',
      400,
      AppError.TYPES.VALIDATION_ERROR
    );
  }
  
  if (!isStrongPassword(password)) {
    throw new AppError(
      'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number',
      400,
      AppError.TYPES.VALIDATION_ERROR
    );
  }
};

// Validate flight data
const validateFlightData = (flightData) => {
  const { flightNumber, airline, source, destination, departureDate, arrivalDate, totalSeats, price } = flightData;
  
  if (!flightNumber || !airline || !source || !destination || !departureDate || !arrivalDate || !totalSeats || !price) {
    throw new AppError(
      'All flight details are required',
      400,
      AppError.TYPES.VALIDATION_ERROR
    );
  }
  
  if (source === destination) {
    throw new AppError(
      'Source and destination cannot be the same',
      400,
      AppError.TYPES.VALIDATION_ERROR
    );
  }
  
  const departure = new Date(departureDate);
  const arrival = new Date(arrivalDate);
  
  if (isNaN(departure.getTime()) || isNaN(arrival.getTime())) {
    throw new AppError(
      'Invalid date format',
      400,
      AppError.TYPES.VALIDATION_ERROR
    );
  }
  
  if (departure >= arrival) {
    throw new AppError(
      'Departure date must be before arrival date',
      400,
      AppError.TYPES.VALIDATION_ERROR
    );
  }
  
  if (totalSeats <= 0) {
    throw new AppError(
      'Total seats must be greater than 0',
      400,
      AppError.TYPES.VALIDATION_ERROR
    );
  }
  
  if (price <= 0) {
    throw new AppError(
      'Price must be greater than 0',
      400,
      AppError.TYPES.VALIDATION_ERROR
    );
  }
};

// Validate booking data
const validateBookingData = (bookingData) => {
  const { flightId, seatNumber, passengerName, passengerEmail, passengerPhone } = bookingData;
  
  if (!flightId || !seatNumber || !passengerName || !passengerEmail) {
    throw new AppError(
      'Flight ID, seat number, passenger name, and passenger email are required',
      400,
      AppError.TYPES.VALIDATION_ERROR
    );
  }
  
  if (!isValidEmail(passengerEmail)) {
    throw new AppError(
      'Invalid passenger email format',
      400,
      AppError.TYPES.VALIDATION_ERROR
    );
  }
  
  if (passengerPhone && !/^\d{10,15}$/.test(passengerPhone)) {
    throw new AppError(
      'Invalid passenger phone number',
      400,
      AppError.TYPES.VALIDATION_ERROR
    );
  }
};

module.exports = {
  isValidEmail,
  isStrongPassword,
  validateUserRegistration,
  validateFlightData,
  validateBookingData
};
