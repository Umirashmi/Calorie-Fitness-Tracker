const { sequelize } = require('../src/config/database');

async function addNameColumnToUsers() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    console.log('Adding name column to users table...');
    
    // Add the name column to the users table
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS name VARCHAR(255) NULL;
    `);
    
    console.log('Name column added successfully!');
    
    // Optional: You can also run a full sync to ensure all models are up to date
    console.log('Syncing all models...');
    await sequelize.sync({ alter: true }); // alter: true will update existing tables
    console.log('Database sync completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

addNameColumnToUsers();