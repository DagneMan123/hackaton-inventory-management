import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";
import ProtectedRoute from "../component/ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import Login from "../page/Login";
import NotFound from "../page/NotFound";
import AdminDashboard from "../page/admin/AdminDashboard";
import Inventory from "../page/admin/Inventory";
import Orders from "../page/admin/Orders";
import Analytics from "../page/admin/Analytics";
import Reports from "../page/admin/Reports";
import Settings from "../page/admin/Settings";
import Profile from "../page/admin/Profile";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager", "sales_officer"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="orders" element={<Orders />} />
        <Route path="profile" element={<Profile />} />
        <Route
          path="analytics"
          element={
            <ProtectedRoute allowedRoles={["admin", "manager"]}>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={["admin", "manager"]}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="/unauthorized" element={<div className="flex items-center justify-center h-screen"><h1 className="text-2xl font-bold text-gray-700">403 — Unauthorized</h1></div>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const RootRedirect = () => {
  const { token } = useContext(UserContext);
  if (!token) return <Navigate to="/login" replace />;
  return <Navigate to="/admin" replace />;
};

export default AppRoutes;
