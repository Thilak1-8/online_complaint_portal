import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, adminOnly }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ If adminOnly is true, check role
  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />; // redirect non-admin users
  }

  return children;
};

export default ProtectedRoute;
