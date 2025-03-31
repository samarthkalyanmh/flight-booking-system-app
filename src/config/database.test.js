const { Sequelize } = require('sequelize');

// Create a new Sequelize instance with SQLite in-memory database for testing
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  // Speed up tests by disabling foreign key constraints in SQLite
  dialectOptions: {
    // SQLite only
    pragma: {
      'foreign_keys': 'OFF'
    }
  }
});

// Function to connect to the database
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Test database connection established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the test database:', error);
    return false;
  }
};

// Function to sync the database (create tables)
const syncDB = async () => {
  try {
    // Force sync to recreate tables
    await sequelize.sync({ force: true });
    console.log('Test database synced successfully.');
    return true;
  } catch (error) {
    console.error('Unable to sync the test database:', error);
    return false;
  }
};

// Function to close the database connection
const closeDB = async () => {
  try {
    await sequelize.close();
    console.log('Test database connection closed successfully.');
    return true;
  } catch (error) {
    console.error('Unable to close the test database connection:', error);
    return false;
  }
};

// Function to clear all tables (faster than dropping and recreating)
const clearDB = async () => {
  try {
    await sequelize.query('PRAGMA foreign_keys = OFF;');
    
    // Get all table names
    const tables = await sequelize.getQueryInterface().showAllTables();
    
    // Truncate all tables
    for (const table of tables) {
      await sequelize.query(`DELETE FROM "${table}";`);
      await sequelize.query(`DELETE FROM sqlite_sequence WHERE name='${table}';`);
    }
    
    await sequelize.query('PRAGMA foreign_keys = ON;');
    
    console.log('Test database cleared successfully.');
    return true;
  } catch (error) {
    console.error('Unable to clear the test database:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  connectDB,
  syncDB,
  closeDB,
  clearDB
};
