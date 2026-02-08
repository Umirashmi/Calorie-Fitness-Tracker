const { sequelize } = require('../src/config/database');
const { initializeModels } = require('../src/models');

async function setupDatabase() {
  try {
    console.log('🚀 Starting database setup...');
    
    // Step 1: Test connection
    console.log('\n1️⃣ Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');

    // Step 2: Initialize models
    console.log('\n2️⃣ Initializing Sequelize models...');
    await initializeModels();
    console.log('✅ Models initialized successfully!');

    // Step 3: Check if tables exist
    console.log('\n3️⃣ Checking existing tables...');
    const queryInterface = sequelize.getQueryInterface();
    const existingTables = await queryInterface.showAllTables();
    console.log('📋 Found tables:', existingTables);

    // Step 4: Sync database
    console.log('\n4️⃣ Synchronizing database schema...');
    if (existingTables.length === 0) {
      console.log('🔨 Creating new database schema...');
      await sequelize.sync({ force: false });
    } else {
      console.log('🔧 Updating existing database schema...');
      await sequelize.sync({ alter: true });
    }
    console.log('✅ Database schema synchronized!');

    // Step 5: Verify tables were created
    console.log('\n5️⃣ Verifying table creation...');
    const finalTables = await queryInterface.showAllTables();
    const requiredTables = ['users', 'foods', 'food_logs', 'goals', 'water_logs', 'user_favorite_foods'];
    
    console.log('📋 Final tables:', finalTables);
    
    const missingTables = requiredTables.filter(table => !finalTables.includes(table));
    if (missingTables.length > 0) {
      console.log('❌ Still missing tables:', missingTables);
      throw new Error('Some required tables were not created');
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('✅ All required tables are now available');
    console.log('🚀 You can now start the server with: npm run dev');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Ensure PostgreSQL is running');
    console.log('2. Check your database credentials in .env file');
    console.log('3. Make sure the database "nutrition_tracker" exists');
    console.log('4. Try running: npm run db:check');
    
    console.log('\n📋 Environment variables needed:');
    console.log('- DB_HOST (default: localhost)');
    console.log('- DB_PORT (default: 5432)');
    console.log('- DB_NAME (default: nutrition_tracker)');
    console.log('- DB_USER (default: postgres)');
    console.log('- DB_PASSWORD (default: password)');
    
    process.exit(1);
  }
}

setupDatabase();