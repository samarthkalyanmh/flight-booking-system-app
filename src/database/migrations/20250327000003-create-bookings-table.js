'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bookings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      flight_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'flights',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      seat_number: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('confirmed', 'cancelled', 'rescheduled', 'pending'),
        defaultValue: 'pending'
      },
      booking_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      payment_status: {
        type: Sequelize.ENUM('paid', 'pending', 'failed', 'refunded'),
        defaultValue: 'pending'
      },
      payment_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      passenger_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      passenger_email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      passenger_phone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('bookings', ['user_id', 'flight_id']);
    await queryInterface.addIndex('bookings', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('bookings');
  }
};
