const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('❌ MONGODB_URI is not set in .env file!');
      process.exit(1);
    }

    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Get admin credentials from command line arguments or use defaults
    const args = process.argv.slice(2);
    const email = args[0] || 'admin@findstore.com';
    const password = args[1] || 'admin123';
    const name = args[2] || 'Admin User';

    // Check if admin user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (existingUser) {
      // Update existing user to admin
      existingUser.role = 'admin';
      existingUser.name = name;
      if (args[1]) {
        // Only update password if provided (will be hashed by pre-save hook)
        existingUser.password = password;
      }
      await existingUser.save();
      console.log(`\n✅ Updated existing user to admin!`);
      console.log(`\n📋 Login Credentials:`);
      console.log(`   Email: ${email.toLowerCase().trim()}`);
      if (args[1]) {
        console.log(`   Password: ${password} (updated)`);
      } else {
        console.log(`   Password: [unchanged - use your existing password]`);
      }
      console.log(`   Name: ${name}`);
    } else {
      // Create new admin user
      const admin = await User.create({
        name,
        email: email.toLowerCase().trim(),
        password,
        role: 'admin'
      });
      console.log(`\n✅ Admin user created successfully!`);
      console.log(`\n📋 Login Credentials:`);
      console.log(`   Email: ${email.toLowerCase().trim()}`);
      console.log(`   Password: ${password}`);
      console.log(`   Name: ${name}`);
    }

    console.log('\n🎉 Admin user is ready!');
    console.log('⚠️  IMPORTANT: Use the email and password shown above to login.\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
    process.exit(1);
  }
};

seedAdmin();

