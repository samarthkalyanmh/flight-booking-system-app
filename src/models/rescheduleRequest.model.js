const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RescheduleRequest = sequelize.define('RescheduleRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  bookingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'booking_id',
    references: {
      model: 'bookings',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  currentFlightId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'current_flight_id',
    references: {
      model: 'flights',
      key: 'id'
    }
  },
  requestedFlightId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'requested_flight_id',
    references: {
      model: 'flights',
      key: 'id'
    }
  },
  requestedSeatNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'requested_seat_number'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
    defaultValue: 'pending'
  },
  notificationSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'notification_sent'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'updated_at'
  }
}, {
  tableName: 'reschedule_requests',
  timestamps: true,
  underscored: true
});

module.exports = RescheduleRequest;
