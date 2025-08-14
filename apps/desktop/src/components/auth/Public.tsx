import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface PublicRouteProps {
  children: React.ReactNode;
  restricted?: boolean; // If true, redirect authenticated users
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  restricted = false,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If route is restricted (like login/signup) and user is authenticated
  if (restricted && isAuthenticated) {
    // Redirect to the intended page or dashboard
    const from = location.state?.from?.pathname || "/chat";
    return <Navigate to={from} replace />;
  }

  // Render the public component
  return <>{children}</>;
};
