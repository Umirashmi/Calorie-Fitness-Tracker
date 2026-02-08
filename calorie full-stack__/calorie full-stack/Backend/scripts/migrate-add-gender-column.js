const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'nutrition_tracker',
  DB_USER = 'postgres',
  DB_PASSWORD = 'password',
} = process.env;

const sequelize = new Sequelize({
  host: DB_HOST,
  port: parseInt(DB_PORT),
  database: DB_NAME,
  username: DB_USER,
  password: DB_PASSWORD,
  dialect: 'postgres',
  logging: console.log,
});

async function addGenderColumn() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected successfully.');

    console.log('Checking if gender column exists...');
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'gender';
    `);

    if (results.length > 0) {
      console.log('Gender column already exists. Skipping migration.');
      return;
    }

    console.log('Adding gender column to users table...');
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN gender VARCHAR(10) 
      CHECK (gender IN ('male', 'female', 'other'));
    `);

    console.log('Gender column added successfully!');
    
    // Test the column by querying the table structure
    console.log('Verifying column addition...');
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Current users table structure:');
    columns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

// Run migration
if (require.main === module) {
  addGenderColumn()
    .then(() => {
      console.log('Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addGenderColumn };