const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    define: { timestamps: true, underscored: true }
  }
);

// Test and connect to DB
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL connection established successfully.');

    // Gracefully close DB connection on app termination
    process.on('SIGINT', async () => {
      await sequelize.close();
      console.log('MySQL connection closed due to app termination');
      process.exit(0);
    });

    return sequelize;
  } catch (error) {
    console.error('Unable to connect to MySQL: ', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
