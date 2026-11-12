import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { UserContext } from "../../context/UserContext";
import {
  Info,
  UserPlus,
  Building2,
  Percent,
  DollarSign,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";

const role_colors = {
  admin: "bg-purple-100 text-purple-700",
  manager: "bg-blue-100 text-blue-700",
  sales_officer: "bg-green-100 text-green-700",
};

const role_labels = {
  admin: "Admin",
  manager: "Manager",
  sales_officer: "Sales Officer",
};

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    disabled={disabled}
    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${checked ? "bg-green-500" : "bg-gray-300"}`}
  >
    <span
      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`}
    />
  </button>
);

const tabs = [
  { id: "general", label: "General", icon: Info },
  { id: "users", label: "Manage Users", icon: Users },
];

const Settings = () => {
  const { backendUrl, token, role, user: me } = useContext(UserContext);
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const [active_tab, set_active_tab] = useState("general");
  const [is_saving, set_is_saving] = useState(false);

  const [users, set_users] = useState([]);
  const [users_loading, set_users_loading] = useState(false);
  const [toggling_id, set_toggling_id] = useState(null);

  const [new_name, set_new_name] = useState("");
  const [new_email, set_new_email] = useState("");
  const [new_pass, set_new_pass] = useState("");
  const [new_role, set_new_role] = useState("sales_officer");

  const load_users = async () => {
    try {
      set_users_loading(true);
      const res = await axios.get(`${backendUrl}/api/auth/users`, { headers });
      set_users(res.data.users || []);
    } catch (err) {
      toast.error("failed to load users");
    } finally {
      set_users_loading(false);
    }
  };

  useEffect(() => {
    if (active_tab === "users") load_users();
  }, [active_tab, backendUrl]);

  const create_user = async (e) => {
    e.preventDefault();
    try {
      set_is_saving(true);
      await axios.post(
        `${backendUrl}/api/auth/register`,
        {
          name: new_name,
          email: new_email,
          password: new_pass,
          role: new_role,
        },
        { headers },
      );
      toast.success(`user "${new_name}" created`);
      set_new_name("");
      set_new_email("");
      set_new_pass("");
      set_new_role("sales_officer");
      load_users();
    } catch (err) {
      toast.error(err.response?.data?.message || "failed to create user");
    } finally {
      set_is_saving(false);
    }
  };

  const toggle_user = async (u) => {
    try {
      set_toggling_id(u.id);
      const res = await axios.patch(
        `${backendUrl}/api/auth/users/${u.id}/toggle`,
        {},
        { headers },
      );
      set_users((prev) => prev.map((x) => (x.id === u.id ? res.data.user : x)));
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "failed to update");
    } finally {
      set_toggling_id(null);
    }
  };

  const delete_user = async (u) => {
    if (!window.confirm(`Delete "${u.name}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${backendUrl}/api/auth/users/${u.id}`, { headers });
      set_users((prev) => prev.filter((x) => x.id !== u.id));
      toast.success("user deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "failed to delete");
    }
  };

  const total_users = users.length;
  const active_users = users.filter((u) => u.isActive).length;
  const admins = users.filter((u) => u.role === "admin").length;
  const managers = users.filter((u) => u.role === "manager").length;
  const officers = users.filter((u) => u.role === "sales_officer").length;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          System preferences and user management
        </p>
      </div>

      <div className="flex gap-6">
        <div className="w-52 shrink-0">
          <nav className="space-y-0.5">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => set_active_tab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${active_tab === id ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6 min-h-96">
          {active_tab === "general" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">
                  General Settings
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  System configuration for Qelem Meda Technologies
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <Building2 size={16} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">
                      Company Name
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      Qelem Meda Technologies PLC
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <Percent size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">
                      VAT Rate
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      15%
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <DollarSign size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">
                      Currency
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      ETB — Ethiopian Birr
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <ShieldCheck size={16} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">
                      Approval Limit
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      50,000 ETB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {active_tab === "users" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">
                    Manage Users
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    View, activate/deactivate and delete users
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {[
                  {
                    label: "Total",
                    value: total_users,
                    color: "text-gray-900",
                  },
                  {
                    label: "Active",
                    value: active_users,
                    color: "text-green-600",
                  },
                  { label: "Admins", value: admins, color: "text-purple-600" },
                  {
                    label: "Managers",
                    value: managers,
                    color: "text-blue-600",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-gray-50 rounded-xl p-3 text-center"
                  >
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {users_loading ? (
                <div className="py-10 text-center text-sm text-gray-400">
                  Loading users...
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {[
                          "Name",
                          "Email",
                          "Role",
                          "Status",
                          "Joined",
                          "Actions",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center py-8 text-gray-400"
                          >
                            No users found
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr
                            key={u.id}
                            className={`border-b border-gray-100 hover:bg-gray-50 ${!u.isActive ? "opacity-60" : ""}`}
                          >
                            <td className="px-4 py-3 font-medium text-gray-900">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                                  {u.name?.charAt(0).toUpperCase()}
                                </div>
                                {u.name}
                                {u.id === me?.id && (
                                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                                    you
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">
                              {u.email}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${role_colors[u.role] || "bg-gray-100 text-gray-600"}`}
                              >
                                {role_labels[u.role] || u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Toggle
                                  checked={u.isActive}
                                  onChange={() => toggle_user(u)}
                                  disabled={
                                    toggling_id === u.id || u.id === me?.id
                                  }
                                />
                                <span
                                  className={`text-xs font-medium ${u.isActive ? "text-green-600" : "text-gray-400"}`}
                                >
                                  {toggling_id === u.id
                                    ? "..."
                                    : u.isActive
                                      ? "Active"
                                      : "Inactive"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs">
                              {u.createdAt
                                ? new Date(u.createdAt).toLocaleDateString()
                                : "—"}
                            </td>
                            <td className="px-4 py-3">
                              {role === "admin" && u.id !== me?.id && (
                                <button
                                  onClick={() => delete_user(u)}
                                  className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600"
                                  title="Delete user"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="border-t pt-5">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Add New User
                </h3>
                <form onSubmit={create_user} className="space-y-4 max-w-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Full Name *
                      </label>
                      <input
                        required
                        value={new_name}
                        onChange={(e) => {
                          const value = e.target.value;
                          const cleanedValue = value.replace(
                            /[^a-zA-Z\s]/g,
                            "",
                          );
                          const formattedValue = cleanedValue.replace(
                            /\b\w/g,
                            (char) => char.toUpperCase(),
                          );

                          set_new_name(formattedValue);
                        }}
                        placeholder="e.g. Abebe Kebede"
                        className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-gray-900 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Email *
                      </label>
                      <input
                        required
                        type="email"
                        value={new_email}
                        onChange={(e) => set_new_email(e.target.value)}
                        placeholder="user@company.com"
                        className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-gray-900 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Password *
                      </label>
                      <input
                        required
                        type="password"
                        value={new_pass}
                        onChange={(e) => set_new_pass(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-gray-900 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Role *
                      </label>
                      <select
                        value={new_role}
                        onChange={(e) => set_new_role(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-gray-900 transition"
                      >
                        <option value="sales_officer">Sales Officer</option>
                        <option value="manager">Manager</option>
                        {role === "admin" && (
                          <option value="admin">Admin</option>
                        )}
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={is_saving}
                    className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 disabled:bg-gray-400 transition"
                  >
                    <UserPlus size={15} />
                    {is_saving ? "Creating..." : "Create User"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
