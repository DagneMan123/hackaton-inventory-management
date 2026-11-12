import { useContext } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft, LogOut, LayoutDashboard } from "lucide-react";
import { UserContext } from "../context/UserContext";

const Unauthorized = () => {
  const { role, user, logout } = useContext(UserContext);

  const roleLabels = {
    admin: "Admin",
    manager: "Manager",
    sales_officer: "Sales Officer",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5 text-red-600">
          <ShieldAlert size={36} />
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          403 — Unauthorized
        </h1>

        <p className="text-gray-500 text-sm mt-2">
          You don't have permission to access this page.
        </p>

        {user && (
          <div className="mt-5 p-3.5 bg-gray-50 rounded-xl text-left border border-gray-100">
            <p className="text-xs text-gray-400">Current Session</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">
              {user.name || user.email}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">Assigned Role:</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {roleLabels[role] || role || "No role assigned"}
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            to="/admin"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition"
          >
            <LayoutDashboard size={16} />
            Dashboard
          </Link>

          <button
            onClick={logout}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
