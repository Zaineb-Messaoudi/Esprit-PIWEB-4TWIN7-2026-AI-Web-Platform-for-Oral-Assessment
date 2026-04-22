import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles }) => {
  const token    = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  if (!allowedRoles.includes(userType)) {
    switch (userType) {
      case 'student':    return <Navigate to="/StudydDashboard"  replace />;
      case 'instructor': return <Navigate to="/teacherdashboard" replace />;
      case 'admin':      return <Navigate to="/AdminDashboard"   replace />;
      default:           return <Navigate to="/home"             replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;