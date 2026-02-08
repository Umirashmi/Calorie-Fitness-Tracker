const { sequelize } = require('../src/config/database');
const { initializeModels } = require('../src/models');

async function syncDatabase() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    console.log('Initializing models...');
    await initializeModels();
    console.log('Models initialized successfully.');

    console.log('Syncing database with alter option...');
    // Using alter: true will modify existing tables to match the current model definitions
    // This is safer than force: true which would drop and recreate tables
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully.');

    console.log('✅ Database sync completed! All tables are now up to date.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    process.exit(1);
  }
}

syncDatabase();