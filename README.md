# Find Store - Full-Stack E-Commerce Application

A modern, full-stack e-commerce web application built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

### User Features
- **Product Browsing**: Browse products with search and filter functionality
- **Product Details**: Detailed product pages with images, descriptions, ratings, and reviews
- **Shopping Cart**: Add products to cart, manage quantities, and checkout
- **User Authentication**: Register, login, and manage user profile
- **Order History**: View past orders and order details
- **Product Reviews**: Rate and review products

### Admin Features
- **Dashboard**: View key metrics, charts, and analytics
- **User Management**: View, manage, and delete users with order history
- **Product Management**: Add, edit, and delete products
- **Order Management**: View all orders and update order status
- **Analytics**: Best-selling products, revenue tracking, order status distribution

## Tech Stack

### Frontend
- **React 18** - UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **Vite** - Build tool

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

## Project Structure

```
Find Store/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   └── Order.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── users.js
│   │   ├── orders.js
│   │   └── admin.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AdminUsers.jsx
│   │   │       ├── AdminProducts.jsx
│   │   │       └── AdminOrders.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── CartContext.jsx
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/findstore
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

4. Start the backend server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory (optional):
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/categories` - Get all categories
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)
- `POST /api/products/:id/reviews` - Add review (protected)

### Users
- `GET /api/users/profile` - Get user profile (protected)
- `PUT /api/users/profile` - Update user profile (protected)

### Orders
- `POST /api/orders` - Create order (protected)
- `GET /api/orders` - Get user's orders (protected)
- `GET /api/orders/:id` - Get single order (protected)

### Admin
- `GET /api/admin/dashboard` - Get dashboard stats (admin only)
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/users/:id` - Get user details (admin only)
- `PUT /api/admin/users/:id` - Update user (admin only)
- `DELETE /api/admin/users/:id` - Delete user (admin only)
- `GET /api/admin/orders` - Get all orders (admin only)
- `PUT /api/admin/orders/:id` - Update order status (admin only)

## Usage

### Creating an Admin User

To create an admin user, you can either:
1. Manually update the user document in MongoDB to set `role: 'admin'`
2. Use MongoDB Compass or mongo shell:
```javascript
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

### Adding Products

Admin users can add products through the admin panel at `/admin/products`. Products require:
- Name
- Description
- Price
- Category
- Stock quantity
- Image URLs (comma-separated)

### User Registration

Users can register with:
- Name
- Email
- Password (minimum 6 characters)
- Phone (optional)

## Features in Detail

### Search & Filter
- Search products by name or description
- Filter by category
- Filter by price range
- Filter by minimum rating
- Sort by price (low to high, high to low), rating, or newest

### Shopping Cart
- Add products to cart
- Update quantities
- Remove items
- View total price
- Checkout (requires login)

### Admin Dashboard
- Total users, products, orders, and revenue
- Best-selling products chart
- Order status distribution pie chart
- Recent orders table

### Product Reviews
- Users can rate products (1-5 stars)
- Users can add comments
- Average rating calculated automatically
- Review count displayed

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected routes (authentication required)
- Admin-only routes (role-based access)
- Input validation with express-validator
- CORS enabled for frontend-backend communication

## Development

### Running in Development Mode

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

### Building for Production

Frontend:
```bash
cd frontend
npm run build
```

The build output will be in the `dist` directory.

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (development/production)

### Frontend (.env)
- `VITE_API_URL` - Backend API URL (default: http://localhost:5000/api)

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check the MONGODB_URI in .env file
- For MongoDB Atlas, ensure your IP is whitelisted

### CORS Errors
- Ensure backend CORS is configured correctly
- Check that frontend is using the correct API URL

### Authentication Issues
- Verify JWT_SECRET is set in backend .env
- Check that tokens are being sent in request headers
- Ensure user role is set correctly for admin access

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on the repository.

