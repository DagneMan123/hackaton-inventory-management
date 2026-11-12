import { useContext, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  FileText,
  Settings,
  Menu,
  LogOut,
  ChevronRight,
  UserCircle,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import logo  from "../assets/kelem.png"


const menuItems = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    path: "/admin",
    roles: ["admin", "manager", "sales_officer"],
  },
  {
    name: "Inventory",
    icon: Package,
    path: "/admin/inventory",
    roles: ["admin", "manager", "sales_officer"],
  },
  {
    name: "Orders",
    icon: ShoppingCart,
    path: "/admin/orders",
    roles: ["admin", "manager", "sales_officer"],
  },
  {
    name: "Analytics",
    icon: BarChart3,
    path: "/admin/analytics",
    roles: ["admin", "manager"],
  },
  {
    name: "Reports",
    icon: FileText,
    path: "/admin/reports",
    roles: ["admin", "manager"],
  },
  {
    name: "Settings",
    icon: Settings,
    path: "/admin/settings",
    roles: ["admin"],
  },
];

const roleLabel = {
  admin: "Admin",
  manager: "Manager",
  sales_officer: "Sales Officer",
};

const Sidebar = () => {
  const location = useLocation();
  const { role, logout, user } = useContext(UserContext);
  const [open, setOpen] = useState(true);

  const filtered = menuItems.filter((item) => item.roles.includes(role));

  const initials = (user?.name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`h-screen bg-white flex flex-col justify-between border-r border-gray-200 transition-all duration-300 ${
        open ? "w-64" : "w-16"
      }`}
    >
      <div>
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          {open && (
            <div>
              <img className="w-10 mx-au" src={logo} />
            </div>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <Menu size={18} />
          </button>
        </div>

        <nav className="p-2 space-y-0.5 mt-2">
          {filtered.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {open && <span>{item.name}</span>}
                {open && isActive && (
                  <ChevronRight size={14} className="ml-auto" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-gray-100 p-2 space-y-0.5">
        <Link
          to="/admin/profile"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            location.pathname === "/admin/profile"
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <div className="w-4.5 h-4.5 rounded-full bg-gray-700 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
            {initials}
          </div>
          {open && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate leading-tight">
                {user?.name || "Profile"}
              </p>
              <p className="text-[10px] text-gray-400 leading-tight capitalize">
                {roleLabel[role] || role}
              </p>
            </div>
          )}
          {open && location.pathname === "/admin/profile" && (
            <ChevronRight size={14} className="ml-auto shrink-0" />
          )}
        </Link>

        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} className="shrink-0" />
          {open && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
