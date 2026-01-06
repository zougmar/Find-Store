const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const resetAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('❌ MONGODB_URI is not set in .env file!');
      process.exit(1);
    }

    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Get admin credentials from command line arguments
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.error('\n❌ Error: Email and password are required!');
      console.error('\nUsage:');
      console.error('  node scripts/resetAdmin.js email@example.com newpassword');
      console.error('\nExample:');
      console.error('  node scripts/resetAdmin.js admin@findstore.com admin123\n');
      process.exit(1);
    }

    const email = args[0].toLowerCase().trim();
    const password = args[1];
    const name = args[2] || 'Admin User';

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.error(`\n❌ Error: User with email "${email}" not found!`);
      console.error('\n💡 Tip: Create a new admin user using:');
      console.error(`   node scripts/seedAdmin.js ${email} ${password} "${name}"\n`);
      process.exit(1);
    }

    // Update user to admin with new password
    user.role = 'admin';
    user.name = name;
    user.password = password; // Will be hashed by pre-save hook
    await user.save();

    console.log(`\n✅ Admin user password reset successfully!`);
    console.log(`\n📋 Login Credentials:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Name: ${name}`);
    console.log('\n🎉 You can now login with these credentials.\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting admin password:', error.message);
    process.exit(1);
  }
};

resetAdmin();

