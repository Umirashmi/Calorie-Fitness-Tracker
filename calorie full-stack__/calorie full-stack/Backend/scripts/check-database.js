const { sequelize } = require('../src/config/database');

async function checkDatabase() {
  try {
    console.log('🔍 Checking database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');

    console.log('\n📊 Checking existing tables...');
    const queryInterface = sequelize.getQueryInterface();
    
    // Check if users table exists
    try {
      const tables = await queryInterface.showAllTables();
      console.log('📋 Existing tables:', tables);
      
      if (tables.length === 0) {
        console.log('\n⚠️  No tables found in database. Database needs initialization.');
        console.log('💡 Run: npm run db:sync');
      } else {
        console.log('\n✅ Database has tables. Checking specific tables...');
        
        const requiredTables = ['users', 'foods', 'food_logs', 'goals', 'water_logs', 'user_favorite_foods'];
        const missingTables = requiredTables.filter(table => !tables.includes(table));
        
        if (missingTables.length > 0) {
          console.log('❌ Missing tables:', missingTables);
          console.log('💡 Run: npm run db:sync');
        } else {
          console.log('✅ All required tables exist!');
        }
      }
    } catch (error) {
      console.error('❌ Error checking tables:', error.message);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check database credentials in environment variables');
    console.log('3. Ensure database exists: nutrition_tracker');
    process.exit(1);
  }
}

checkDatabase();