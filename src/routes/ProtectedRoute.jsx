import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageLoader from "../components/ui/PageLoader";

export default function ProtectedRoute({ children, rolesPermitidos }) {
  const { user, rol, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (rolesPermitidos && !rolesPermitidos.includes(rol)) return <Navigate to="/" replace />;
  return children;
}
