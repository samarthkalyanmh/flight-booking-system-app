'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if flights already exist
    const existingFlights = await queryInterface.sequelize.query(
      `SELECT * FROM flights WHERE flight_number IN ('FL001', 'FL002', 'FL003', 'FL004', 'FL005')`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // If flights already exist, skip
    if (existingFlights.length > 0) {
      console.log('Sample flights already exist, skipping...');
      return;
    }

    // Create sample flights
    await queryInterface.bulkInsert('flights', [
      {
        flight_number: 'FL001',
        airline: 'Air India',
        source: 'Delhi',
        destination: 'Mumbai',
        departure_date: new Date(2025, 3, 15, 10, 0, 0), // April 15, 2025, 10:00 AM
        arrival_date: new Date(2025, 3, 15, 12, 0, 0), // April 15, 2025, 12:00 PM
        total_seats: 150,
        available_seats: 150,
        price: 5000.00,
        status: 'scheduled',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        flight_number: 'FL002',
        airline: 'IndiGo',
        source: 'Mumbai',
        destination: 'Bangalore',
        departure_date: new Date(2025, 3, 16, 14, 0, 0), // April 16, 2025, 2:00 PM
        arrival_date: new Date(2025, 3, 16, 16, 0, 0), // April 16, 2025, 4:00 PM
        total_seats: 180,
        available_seats: 180,
        price: 4500.00,
        status: 'scheduled',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        flight_number: 'FL003',
        airline: 'SpiceJet',
        source: 'Bangalore',
        destination: 'Chennai',
        departure_date: new Date(2025, 3, 17, 9, 0, 0), // April 17, 2025, 9:00 AM
        arrival_date: new Date(2025, 3, 17, 10, 30, 0), // April 17, 2025, 10:30 AM
        total_seats: 120,
        available_seats: 120,
        price: 3500.00,
        status: 'scheduled',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        flight_number: 'FL004',
        airline: 'Vistara',
        source: 'Delhi',
        destination: 'Kolkata',
        departure_date: new Date(2025, 3, 18, 11, 0, 0), // April 18, 2025, 11:00 AM
        arrival_date: new Date(2025, 3, 18, 13, 30, 0), // April 18, 2025, 1:30 PM
        total_seats: 200,
        available_seats: 200,
        price: 6000.00,
        status: 'scheduled',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        flight_number: 'FL005',
        airline: 'Air India',
        source: 'Chennai',
        destination: 'Delhi',
        departure_date: new Date(2025, 3, 19, 16, 0, 0), // April 19, 2025, 4:00 PM
        arrival_date: new Date(2025, 3, 19, 19, 0, 0), // April 19, 2025, 7:00 PM
        total_seats: 150,
        available_seats: 150,
        price: 5500.00,
        status: 'scheduled',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('flights', {
      flight_number: {
        [Sequelize.Op.in]: ['FL001', 'FL002', 'FL003', 'FL004', 'FL005']
      }
    });
  }
};
