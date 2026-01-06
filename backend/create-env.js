#!/usr/bin/env node

/**
 * Helper script to create .env file
 * Run: node create-env.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createEnvFile() {
  console.log('\n🔧 MongoDB Connection Setup\n');
  console.log('This script will help you create a .env file with the correct MongoDB connection string.\n');

  const useAtlas = await question('Are you using MongoDB Atlas (cloud)? (y/n): ');
  
  let mongoURI;
  
  if (useAtlas.toLowerCase() === 'y' || useAtlas.toLowerCase() === 'yes') {
    console.log('\n📋 MongoDB Atlas Setup:');
    console.log('1. Go to MongoDB Atlas → Connect → Connect your application');
    console.log('2. Copy the connection string\n');
    
    const connectionString = await question('Paste your MongoDB Atlas connection string: ');
    
    // Extract database name if not present
    let finalConnectionString = connectionString.trim();
    if (!finalConnectionString.includes('/findstore') && !finalConnectionString.match(/\/[^?]+/)) {
      finalConnectionString = finalConnectionString.replace('mongodb+srv://', 'mongodb+srv://');
      if (finalConnectionString.includes('?')) {
        finalConnectionString = finalConnectionString.replace('?', '/findstore?');
      } else {
        finalConnectionString += '/findstore';
      }
    }
    
    mongoURI = finalConnectionString;
  } else {
    console.log('\n📋 Local MongoDB Setup:');
    const dbName = await question('Database name (default: findstore): ') || 'findstore';
    mongoURI = `mongodb://localhost:27017/${dbName}`;
  }

  const port = await question('\nBackend port (default: 5000): ') || '5000';
  const jwtSecret = await question('JWT Secret (default: your_jwt_secret_key_here): ') || 'your_jwt_secret_key_here';
  const nodeEnv = await question('Node environment (default: development): ') || 'development';

  const envContent = `PORT=${port}
MONGODB_URI=${mongoURI}
JWT_SECRET=${jwtSecret}
NODE_ENV=${nodeEnv}
`;

  const envPath = path.join(__dirname, '.env');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env file created successfully!');
    console.log(`📁 Location: ${envPath}\n`);
    console.log('⚠️  Important for MongoDB Atlas:');
    console.log('   1. Make sure your IP address is whitelisted in MongoDB Atlas');
    console.log('   2. Verify your database user credentials are correct');
    console.log('   3. If your password has special characters, URL-encode them\n');
    console.log('🚀 You can now start the server with: npm run dev\n');
  } catch (error) {
    console.error('\n❌ Error creating .env file:', error.message);
  }

  rl.close();
}

createEnvFile().catch(error => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});

