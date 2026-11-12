import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, role } = useContext(UserContext);

  if (!token) return <Navigate to="/login" replace />;
  {console.log(token, role);
  }
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/unauthorized" replace />;

  return children;
};

export default ProtectedRoute;