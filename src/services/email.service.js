const { consumeQueue } = require('../config/rabbitmq');
const { sendEmail } = require('../config/email');
const { User, Flight, Booking } = require('../models');
const { Op } = require('sequelize');

const processEmailNotifications = async () => {
  try {
    console.log('Starting email notification service...');
    
    await consumeQueue('email_notifications', async (message) => {
      try {
        console.log('Processing email notification:', message.type);
        
        switch (message.type) {
          case 'booking_confirmation':
            await sendBookingConfirmationEmail(message);
            break;
          
          case 'booking_cancellation':
            await sendBookingCancellationEmail(message);
            break;
          
          case 'flight_status_update':
            await sendFlightStatusUpdateEmail(message);
            break;
          
          case 'reschedule_confirmation':
            await sendRescheduleConfirmationEmail(message);
            break;
          
          case 'reschedule_availability':
            await sendRescheduleAvailabilityEmail(message);
            break;
          
          default:
            console.warn(`Unknown email notification type: ${message.type}`);
        }
      } catch (error) {
        console.error('Error processing email notification:', error);
      }
    });
    
    console.log('Email notification service started successfully');
  } catch (error) {
    console.error('Error starting email notification service:', error);
    throw error; 
  }
};

const sendBookingConfirmationEmail = async (data) => {
  const { bookingId, passengerEmail, passengerName, flightDetails, seatNumber } = data;
  
  const emailContent = {
    to: passengerEmail,
    subject: `Booking Confirmation - Flight ${flightDetails.flightNumber}`,
    text: `
      Dear ${passengerName},
      
      Your flight booking has been confirmed.
      
      Booking Details:
      - Booking ID: ${bookingId}
      - Flight Number: ${flightDetails.flightNumber}
      - Airline: ${flightDetails.airline}
      - From: ${flightDetails.source}
      - To: ${flightDetails.destination}
      - Departure: ${new Date(flightDetails.departureDate).toLocaleString()}
      - Arrival: ${new Date(flightDetails.arrivalDate).toLocaleString()}
      - Seat Number: ${seatNumber}
    `
  };
  
  const result = await sendEmail(emailContent);
  if (result.success) {
    console.log(`Booking confirmation email sent to ${passengerEmail}`);
  } else {
    console.warn(`Failed to send booking confirmation email to ${passengerEmail}: ${result.error}`);
  }
};

const sendBookingCancellationEmail = async (data) => {
  const { bookingId, passengerEmail, passengerName, flightDetails } = data;
  
  const emailContent = {
    to: passengerEmail,
    subject: `Booking Cancellation - Flight ${flightDetails.flightNumber}`,
    text: `
      Dear ${passengerName},
      
      Your flight booking has been cancelled.
      
      Booking Details:
      - Booking ID: ${bookingId}
      - Flight Number: ${flightDetails.flightNumber}
      - Airline: ${flightDetails.airline}
      - From: ${flightDetails.source}
      - To: ${flightDetails.destination}
      - Departure: ${new Date(flightDetails.departureDate).toLocaleString()}
    `
  };
  
  const result = await sendEmail(emailContent);
  if (result.success) {
    console.log(`Booking cancellation email sent to ${passengerEmail}`);
  } else {
    console.warn(`Failed to send booking cancellation email to ${passengerEmail}: ${result.error}`);
  }
};


const sendFlightStatusUpdateEmail = async (data) => {
  const { flightId, status, reason } = data;
  
  try {
    const flight = await Flight.findByPk(flightId);
    if (!flight) {
      throw new Error(`Flight not found with ID: ${flightId}`);
    }
    
    const bookings = await Booking.findAll({
      where: {
        flightId,
        status: {
          [Op.ne]: 'cancelled'
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const booking of bookings) {
      const emailContent = {
        to: booking.passengerEmail,
        subject: `Flight Status Update - ${flight.flightNumber}`,
        text: `
          Dear ${booking.passengerName},
          
          We would like to inform you that the status of your flight has been updated.
          
          Flight Details:
          - Flight Number: ${flight.flightNumber}
          - Airline: ${flight.airline}
          - From: ${flight.source}
          - To: ${flight.destination}
          - Departure: ${new Date(flight.departureDate).toLocaleString()}
          
        `
      };
      
      const result = await sendEmail(emailContent);
      if (result.success) {
        console.log(`Flight status update email sent to ${booking.passengerEmail}`);
        successCount++;
      } else {
        console.warn(`Failed to send flight status update email to ${booking.passengerEmail}: ${result.error}`);
        failureCount++;
      }
    }
    
    if (failureCount > 0) {
      console.warn(`Failed to send ${failureCount} out of ${bookings.length} flight status update emails.`);
      console.warn('This is likely due to email configuration issues. The flight status was still updated successfully.');
    }
    
    if (successCount > 0) {
      console.log(`Successfully sent ${successCount} flight status update emails.`);
    }
  } catch (error) {
    console.error('Error sending flight status update emails:', error);
  }
};

const sendRescheduleConfirmationEmail = async (data) => {
  const { bookingId, passengerEmail, passengerName, oldFlightDetails, newFlightDetails } = data;
  
  const emailContent = {
    to: passengerEmail,
    subject: `Flight Reschedule Confirmation - Booking #${bookingId}`,
    text: `
      Dear ${passengerName},
      
      Your flight has been successfully rescheduled.
      
      Original Flight Details:
      - Flight Number: ${oldFlightDetails.flightNumber}
      - Airline: ${oldFlightDetails.airline}
      - From: ${oldFlightDetails.source}
      - To: ${oldFlightDetails.destination}
      - Departure: ${new Date(oldFlightDetails.departureDate).toLocaleString()}
      - Seat Number: ${oldFlightDetails.seatNumber}
      
      New Flight Details:
      - Flight Number: ${newFlightDetails.flightNumber}
      - Airline: ${newFlightDetails.airline}
      - From: ${newFlightDetails.source}
      - To: ${newFlightDetails.destination}
      - Departure: ${new Date(newFlightDetails.departureDate).toLocaleString()}
      - Seat Number: ${newFlightDetails.seatNumber}
    `
  };
  
  const result = await sendEmail(emailContent);
  if (result.success) {
    console.log(`Reschedule confirmation email sent to ${passengerEmail}`);
  } else {
    console.warn(`Failed to send reschedule confirmation email to ${passengerEmail}: ${result.error}`);
  }
};

const sendRescheduleAvailabilityEmail = async (data) => {
  const { bookingId, passengerEmail, passengerName, currentFlightDetails, requestedFlightDetails } = data;
  
  const emailContent = {
    to: passengerEmail,
    subject: `Seat Available for Your Requested Flight - Booking #${bookingId}`,
    text: `
      Dear ${passengerName},
      
      Good news! A seat is now available on the flight you requested to reschedule to.
      
      Current Flight Details:
      - Flight Number: ${currentFlightDetails.flightNumber}
      - Airline: ${currentFlightDetails.airline}
      - From: ${currentFlightDetails.source}
      - To: ${currentFlightDetails.destination}
      - Departure: ${new Date(currentFlightDetails.departureDate).toLocaleString()}
      
      Available Flight Details:
      - Flight Number: ${requestedFlightDetails.flightNumber}
      - Airline: ${requestedFlightDetails.airline}
      - From: ${requestedFlightDetails.source}
      - To: ${requestedFlightDetails.destination}
      - Departure: ${new Date(requestedFlightDetails.departureDate).toLocaleString()}
      
      Please log in to your account to confirm this reschedule.
      
      Thank you for choosing our service.
      
      Flight Booking System
    `
  };
  
  const result = await sendEmail(emailContent);
  if (result.success) {
    console.log(`Reschedule availability email sent to ${passengerEmail}`);
  } else {
    console.warn(`Failed to send reschedule availability email to ${passengerEmail}: ${result.error}`);
  }
};

module.exports = {
  processEmailNotifications
};
