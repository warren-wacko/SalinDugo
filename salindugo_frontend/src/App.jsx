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
import ImportData from "./views/hospital/components/ImportPage";

// Authentication Pages
import LoginPage from "./views/authentication/login/page";
import SignUpPage from "./views/authentication/signup/page";
import ResetPasswordPage from "./views/authentication/reset-password/page";
import TermsPage from "./views/terms/page";
import PrivacyPage from "./views/privacy/page";
import ChangePasswordPage from "./views/user/change-password/page";

// Dashboard Pages
import UserDashboard from "./views/user/dashboard/page";
import HospitalDashboard from "./views/hospital/dashboard/page";
import AdminDashboard from "./views/admin/dashboard/page";
import ProfilePage from "./views/user/profile/page";

import { Toaster } from "sonner";

function App() {
  const { user, isLoading } = useContext(AuthContext);

  // 🆕 Wait for auth to load
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster richColors position="top-center" />
      <Routes>
        Landing Page
        <Route
          path="/"
          element={
            user ? (
              // 🔹 ONLY check dashboard routing, NOT profile_completed
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
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path="/terms"
          element={
            <PublicRoute>
              <TermsPage />
            </PublicRoute>
          }
        />
        <Route
          path="/privacy"
          element={
            <PublicRoute>
              <PrivacyPage />
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
            <PrivateRoute allowedRoles={["user", "hospital", "admin"]}>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <PrivateRoute allowedRoles={["user", "hospital", "admin"]}>
              <ChangePasswordPage />
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
          path="/import-data"
          element={
            <PrivateRoute allowedRoles={["hospital"]}>
              <ImportData />
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
