import { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// Page & Component Imports
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Maintenance from "./pages/Maintenance";
import AdminDashboard from "./pages/AdminDashboard";
import CreateListing from "./components/Forms/CreateListing";
import ProductDetail from "./pages/ProductDetail";
import VerifyEmail from "./pages/VerifyEmail";
import Footer from "./components/Layout/Footer";
import ProfilePage from "./pages/ProfilePage";
import CartPage from "./pages/Cart";
import OrdersPage from "./pages/Orders";
import ChatPage from "./pages/Chat";

/**
 * Protected route wrapper
 */
function ProtectedRoute({ isAuthenticated, children }) {
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/**
 * Admin-only route wrapper
 */
function AdminRoute({ isAuthenticated, isAdmin, children }) {
  return isAuthenticated && isAdmin ? children : <Navigate to="/" replace />;
}

/**
 * Main Application Component
 */
export default function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const location = useLocation();

  const hideFooterRoutes = [
    "/dashboard",
    "/maintenance",
    "/admin",
    "/listings",
    "/users",
    "/chat",
    "/create-listing",
    "/verify",
    "/profile",
    "/cart",
    "/orders",
  ];

  const shouldShowFooter = !hideFooterRoutes.some((path) =>
    location.pathname.startsWith(path)
  );

  const token = localStorage.getItem("token");
  const storedUser = user || JSON.parse(localStorage.getItem("user") || "null");

  const isAuthenticated = !!token;
  const isAdmin =
    storedUser?.role === "admin" || storedUser?.is_admin === true;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <main style={{ flex: 1 }}>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/verify/:token" element={<VerifyEmail />} />

          {/* PROTECTED ROUTES */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Dashboard user={storedUser} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/maintenance"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Maintenance user={storedUser} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/create-listing"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <CreateListing />
              </ProtectedRoute>
            }
          />

          <Route
            path="/create-listing/:id"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <CreateListing />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cart"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <CartPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <OrdersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/chat"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <ChatPage />
              </ProtectedRoute>
            }
          />

          {/* ADMIN ROUTES */}
          <Route
            path="/admin"
            element={
              <AdminRoute isAuthenticated={isAuthenticated} isAdmin={isAdmin}>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/listings"
            element={
              <AdminRoute isAuthenticated={isAuthenticated} isAdmin={isAdmin}>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/maintenance"
            element={
              <AdminRoute isAuthenticated={isAuthenticated} isAdmin={isAdmin}>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <AdminRoute isAuthenticated={isAuthenticated} isAdmin={isAdmin}>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {shouldShowFooter && <Footer />}
    </div>
  );
}