'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if admin user already exists
    const adminUser = await queryInterface.sequelize.query(
      `SELECT * FROM users WHERE email = 'admin@example.com'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // If admin user already exists, skip
    if (adminUser.length > 0) {
      console.log('Admin user already exists, skipping...');
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Create admin user
    await queryInterface.bulkInsert('users', [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', { email: 'admin@example.com' });
  }
};
