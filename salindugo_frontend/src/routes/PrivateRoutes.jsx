import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    // not logged in
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // logged in but not allowed
    return <Navigate to="/" replace />;
  }

  // 🔹 Only redirect to /profile if NOT already on /profile
  if (
    (user.role === "user" || user.role === "hospital") &&
    !user.profile_completed &&
    window.location.pathname !== "/profile"
  ) {
    return <Navigate to="/profile" replace />;
  }

  return children; // logged in + role is allowed
};

export default PrivateRoute;
