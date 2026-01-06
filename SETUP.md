# Quick Setup Guide

## Initial Setup Steps

### 1. Install MongoDB
- Download and install MongoDB from https://www.mongodb.com/try/download/community
- Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/findstore
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
```

Start backend:
```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Start frontend:
```bash
npm run dev
```

## Creating Your First Admin User

### Method 1: Using MongoDB Compass or mongo shell

1. Register a user through the frontend (http://localhost:3000/register)
2. Open MongoDB Compass or mongo shell
3. Connect to your database
4. Navigate to the `users` collection
5. Find your user document
6. Update the `role` field from `"user"` to `"admin"`

### Method 2: Using mongo shell directly

```javascript
// Connect to MongoDB
use findstore

// Update user role to admin
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

### Method 3: Create admin user directly in MongoDB

```javascript
use findstore

db.users.insertOne({
  name: "Admin User",
  email: "admin@example.com",
  password: "$2a$10$...", // You'll need to hash the password first
  role: "admin"
})
```

**Note**: For Method 3, you need to hash the password. The easiest way is to register through the frontend first, then change the role.

## Adding Sample Products

Once you're logged in as admin:

1. Navigate to http://localhost:3000/admin/products
2. Click "Add New Product"
3. Fill in the product details:
   - Name: e.g., "Wireless Headphones"
   - Description: Product description
   - Price: e.g., 99.99
   - Category: e.g., "Electronics"
   - Stock: e.g., 50
   - Image URLs: Add image URLs (comma-separated), e.g., "https://example.com/image.jpg"

## Testing the Application

1. **User Registration**: Register a new user at http://localhost:3000/register
2. **Browse Products**: View products on the home page
3. **Product Details**: Click on any product to see details
4. **Add to Cart**: Add products to cart
5. **Checkout**: Proceed to checkout (requires login)
6. **Admin Panel**: Access admin features at http://localhost:3000/admin (admin only)

## Common Issues

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod` (if local)
- Check MONGODB_URI in backend/.env
- For MongoDB Atlas, ensure your IP is whitelisted

### Port Already in Use
- Change PORT in backend/.env
- Update frontend API URL if backend port changes

### CORS Errors
- Ensure backend is running
- Check that frontend proxy is configured in vite.config.js

### Cannot Access Admin Panel
- Verify user role is set to "admin" in database
- Logout and login again after changing role

## Next Steps

1. Add more products through the admin panel
2. Test the search and filter functionality
3. Place test orders
4. Explore the admin dashboard analytics
5. Customize the UI and add more features as needed

