const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Flight = sequelize.define('Flight', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  flightNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Flight number is required'
      }
    }
  },
  airline: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Airline name is required'
      }
    }
  },
  source: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Source is required'
      }
    }
  },
  destination: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Destination is required'
      }
    }
  },
  departureDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Departure date is required'
      },
      isDate: {
        msg: 'Invalid departure date format'
      }
    }
  },
  arrivalDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Arrival date is required'
      },
      isDate: {
        msg: 'Invalid arrival date format'
      }
    }
  },
  totalSeats: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [1],
        msg: 'Total seats must be at least 1'
      }
    }
  },
  availableSeats: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Available seats cannot be negative'
      }
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Price cannot be negative'
      }
    }
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'delayed', 'cancelled', 'completed'),
    defaultValue: 'scheduled'
  }
}, {
  timestamps: true,
  tableName: 'flights',
  hooks: {
    beforeValidate: (flight) => {
      // Validate that available seats are not more than total seats
      if (flight.availableSeats > flight.totalSeats) {
        throw new Error('Available seats cannot be more than total seats');
      }
      
      // Validate that source and destination are not the same
      if (flight.source && flight.destination && 
          flight.source.toLowerCase() === flight.destination.toLowerCase()) {
        throw new Error('Source and destination cannot be the same');
      }
      
      // Validate that arrival date is after departure date
      if (flight.arrivalDate && flight.departureDate && 
          new Date(flight.arrivalDate) <= new Date(flight.departureDate)) {
        throw new Error('Arrival date must be after departure date');
      }
    }
  }
});

module.exports = Flight;
