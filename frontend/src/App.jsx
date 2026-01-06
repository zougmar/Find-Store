import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { FavoritesProvider } from './context/FavoritesContext'
import { LanguageProvider } from './context/LanguageContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Products from './pages/Products'
import About from './pages/About'
import Contact from './pages/Contact'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminProducts from './pages/admin/AdminProducts'
import AdminOrders from './pages/admin/AdminOrders'
import AdminPages from './pages/admin/AdminPages'
import AdminMessages from './pages/admin/AdminMessages'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>
            <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public routes with Navbar */}
              <Route path="/" element={
                <>
                  <Navbar />
                  <Home />
                </>
              } />
              <Route path="/products" element={
                <>
                  <Navbar />
                  <Products />
                </>
              } />
              <Route path="/about" element={
                <>
                  <Navbar />
                  <About />
                </>
              } />
              <Route path="/contact" element={
                <>
                  <Navbar />
                  <Contact />
                </>
              } />
              <Route path="/product/:id" element={
                <>
                  <Navbar />
                  <ProductDetail />
                </>
              } />
              <Route path="/cart" element={
                <>
                  <Navbar />
                  <Cart />
                </>
              } />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/profile"
                element={
                  <>
                    <Navbar />
                    <ProtectedRoute adminOnly>
                      <Profile />
                    </ProtectedRoute>
                  </>
                }
              />
              
              {/* Admin routes without Navbar (they have their own layout) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/products"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminProducts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/pages"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminPages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/messages"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminMessages />
                  </ProtectedRoute>
                }
              />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>
    </LanguageProvider>
  )
}

export default App
