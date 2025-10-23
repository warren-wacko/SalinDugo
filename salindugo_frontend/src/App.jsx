import "./App.css";
// src/App.jsx or wherever you define routes
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import { Navigate } from "react-router-dom";

import { Routes, Route } from "react-router-dom";
import PrivateRoute from "./routes/PrivateRoutes";
import PublicRoute from "./routes/PublicRoutes";

// Importing all the page components
import HomePage from "./views/homepage/page";

// Authentication Pages
import LoginPage from "./views/authentication/login/page";
import SignUpPage from "./views/authentication/signup/page";

// Dashboard Pages
import UserDashboard from "./views/user/dashboard/page";
import HospitalDashboard from "./views/hospital/dashboard/page";
import AdminDashboard from "./views/admin/dashboard/page";
import ProfilePage from "./views/user/profile/page";

import { Toaster } from "sonner";

function App() {
  const { user } = useContext(AuthContext);

  return (
    <>
      <Toaster richColors position="top-center" />
      <Routes>
        Landing Page
        <Route
          path="/"
          element={
            user ? (
              // 🔹 If logged in → redirect to dashboard
              (() => {
                switch (user.role) {
                  case "user":
                    return <Navigate to="/user-dashboard" />;
                  case "hospital":
                    return <Navigate to="/hospital-dashboard" />;
                  case "admin":
                    return <Navigate to="/admin-dashboard" />;
                  default:
                    return <Navigate to="/login" />;
                }
              })()
            ) : (
              // 🔹 If not logged in → show landing page
              <HomePage />
            )
          }
        />
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <SignUpPage />
            </PublicRoute>
          }
        />
        {/* Private routes */}
        <Route
          path="/user-dashboard"
          element={
            <PrivateRoute allowedRoles={["user"]}>
              <UserDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute allowedRoles={["user", "hospital"]}>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/hospital-dashboard"
          element={
            <PrivateRoute allowedRoles={["hospital"]}>
              <HospitalDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
