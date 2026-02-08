const { sequelize } = require('../src/config/database');
const { initializeModels } = require('../src/models');

async function initializeDatabase() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    console.log('Initializing models...');
    await initializeModels();
    console.log('Models initialized successfully.');

    console.log('Synchronizing database...');
    await sequelize.sync({ force: true }); // WARNING: This will drop existing tables
    console.log('Database synchronized successfully.');

    console.log('Database initialization completed!');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();