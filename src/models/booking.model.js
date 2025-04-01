const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
// const Flight = require('./flight.model')

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  flightId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'flights',
      key: 'id'
    }
  },
  seatNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Seat number is required'
      }
    }
  },
  status: {
    type: DataTypes.ENUM('confirmed', 'cancelled', 'rescheduled', 'pending'),
    defaultValue: 'pending'
  },
  bookingDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  paymentStatus: {
    type: DataTypes.ENUM('paid', 'pending', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  paymentAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Payment amount cannot be negative'
      }
    }
  },
  passengerName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Passenger name is required'
      }
    }
  },
  passengerEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: {
        msg: 'Please provide a valid email address'
      },
      notEmpty: {
        msg: 'Passenger email is required'
      }
    }
  },
  passengerPhone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Passenger phone is required'
      }
    }
  }
}, {
  timestamps: true,
  tableName: 'bookings',
  indexes: [
    {
      fields: ['userId', 'flightId']
    },
    {
      fields: ['status']
    }
  ]
});

// Booking.belongsTo(Flight, {
//   foreignKey: 'flightId',
//   as: 'flight' // Alias used in your query
// });

module.exports = Booking;
