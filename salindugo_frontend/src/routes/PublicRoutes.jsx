// src/routes/PublicRoute.jsx
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const PublicRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

  if (user) {
    // Redirect based on role
    switch (user.role) {
      case "donor":
        return <Navigate to="/donor-dashboard" />;
      case "recipient":
        return <Navigate to="/recipient-dashboard" />;
      case "hospital":
        return <Navigate to="/hospital-dashboard" />;
      case "admin":
        return <Navigate to="/admin-dashboard" />;
      default:
        return <Navigate to="/" />; // fallback if role is unknown
    }
  }

  return children; // not logged in → show login/register
};

export default PublicRoute;
