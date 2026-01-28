const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
// CORS configuration - allow requests from frontend
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      process.env.FRONTEND_URL, // Vercel URL
    ];
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowed => {
      if (!allowed) return false;
      return origin === allowed;
    });
    
    // Also allow all Vercel preview deployments
    const isVercelPreview = /\.vercel\.app$/.test(origin);
    
    if (isAllowed || isVercelPreview || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/pages', require('./routes/pages'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/product-inquiries', require('./routes/productInquiries'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/delivery', require('./routes/delivery'));
app.use('/api/moderator', require('./routes/moderator'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Connect to MongoDB (cache connection for serverless)
let cachedDb = null;

const connectDB = async () => {
  // Return cached connection if available (for serverless)
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  const mongoURI = process.env.MONGODB_URI;
  
  if (!mongoURI) {
    const errorMsg = '\n❌ MONGODB_URI is not set in environment variables!\n';
    console.error(errorMsg);
    if (require.main === module) {
      console.error('\n📝 Please create a .env file in the backend folder with:');
      console.error('   For MongoDB Atlas:');
      console.error('   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/findstore?retryWrites=true&w=majority');
      console.error('\n   For Local MongoDB:');
      console.error('   MONGODB_URI=mongodb://localhost:27017/findstore');
      console.error('\n   See MONGODB_SETUP.md for detailed instructions.\n');
      process.exit(1);
    }
    throw new Error('MONGODB_URI is not set');
  }

  try {
    const conn = await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    cachedDb = conn;
    return conn;
  } catch (error) {
    console.error('\n❌ MongoDB connection error:', error.message);
    if (require.main === module) {
      console.error('\n⚠️  Please check your MongoDB connection string in .env file');
      console.error('\nFor MongoDB Atlas, ensure:');
      console.error('  1. Your IP address is whitelisted (Network Access in Atlas)');
      console.error('  2. Database user credentials are correct (Database Access in Atlas)');
      console.error('  3. Connection string format is correct');
      console.error('  4. Password is URL-encoded if it contains special characters');
      console.error('\nExample connection string:');
      console.error('   mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/findstore?retryWrites=true&w=majority');
      console.error('\n📖 See MONGODB_SETUP.md for detailed troubleshooting guide.\n');
      process.exit(1);
    }
    throw error;
  }
};

// Initialize DB connection
connectDB().catch(console.error);

// Export app for Vercel serverless functions
module.exports = app;

// Start server only if not in serverless environment
if (require.main === module) {
  const startServer = async () => {
    try {
      await connectDB();
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  };
  startServer();
}
