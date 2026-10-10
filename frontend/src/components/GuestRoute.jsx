import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Common.css";

export default function GuestRoute() {
  const { user, loading } = useAuth();

  if (loading) return <div className="page-loading">Loading...</div>;
  if (user) return <Navigate to="/feed" replace />;
  return <Outlet />;
}
