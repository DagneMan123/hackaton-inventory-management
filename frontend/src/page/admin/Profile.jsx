import { useContext, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { UserContext } from "../../context/UserContext";
import {
  User,
  Shield,
  Mail,
  BadgeCheck,
  Eye,
  EyeOff,
  Save,
  Calendar,
  Hash,
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

const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
      <Icon size={15} className="text-gray-500" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">
        {value || "—"}
      </p>
    </div>
  </div>
);

const Profile = () => {
  const { backendUrl, token, user, setUser, setRole } = useContext(UserContext);
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const [name, set_name] = useState(user?.name || "");
  const [email, set_email] = useState(user?.email || "");
  const [saving_profile, set_saving_profile] = useState(false);

  const [cur_pass, set_cur_pass] = useState("");
  const [new_pass, set_new_pass] = useState("");
  const [confirm_pass, set_confirm_pass] = useState("");
  const [show_cur, set_show_cur] = useState(false);
  const [show_new, set_show_new] = useState(false);
  const [show_confirm, set_show_confirm] = useState(false);
  const [saving_pass, set_saving_pass] = useState(false);

  const save_profile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("name is required");
    if (!email.trim()) return toast.error("email is required");
    try {
      set_saving_profile(true);
      const res = await axios.put(
        `${backendUrl}/api/auth/profile`,
        { name: name.trim(), email: email.trim() },
        { headers },
      );
      const updated = res.data.user;
      setUser(updated);
      setRole(updated.role);
      toast.success("profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "failed to update profile");
    } finally {
      set_saving_profile(false);
    }
  };

  const save_password = async (e) => {
    e.preventDefault();
    if (!cur_pass) return toast.error("enter your current password");
    if (!new_pass) return toast.error("enter a new password");
    if (new_pass.length < 6) return toast.error("password min 6 chars");
    if (new_pass !== confirm_pass) return toast.error("passwords do not match");
    try {
      set_saving_pass(true);
      await axios.put(
        `${backendUrl}/api/auth/change-password`,
        { currentPassword: cur_pass, newPassword: new_pass },
        { headers },
      );
      toast.success("password changed");
      set_cur_pass("");
      set_new_pass("");
      set_confirm_pass("");
    } catch (err) {
      toast.error(err.response?.data?.message || "failed to change password");
    } finally {
      set_saving_pass(false);
    }
  };

  const initials = (user?.name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-ET", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  const pass_strength =
    (new_pass.length >= 6 ? 1 : 0) +
    (/[A-Z]/.test(new_pass) ? 1 : 0) +
    (/[0-9]/.test(new_pass) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(new_pass) ? 1 : 0);

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          View and manage your account information
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center text-white text-2xl font-bold mx-auto">
              {initials}
            </div>
            <p className="mt-3 text-base font-bold text-gray-900">
              {user?.name || "—"}
            </p>
            <p className="text-sm text-gray-500 mt-0.5 truncate">
              {user?.email || "—"}
            </p>
            <span
              className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold ${role_colors[user?.role] || "bg-gray-100 text-gray-600"}`}
            >
              {role_labels[user?.role] || user?.role}
            </span>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5">
              <BadgeCheck size={15} className="text-green-500" />
              <span className="text-xs text-green-600 font-medium">
                Active Account
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-900 mb-2">
              Account Details
            </p>
            <InfoRow label="Full Name" value={user?.name} icon={User} />
            <InfoRow label="Email Address" value={user?.email} icon={Mail} />
            <InfoRow
              label="Role"
              value={role_labels[user?.role] || user?.role}
              icon={BadgeCheck}
            />
            <InfoRow
              label="User ID"
              value={user?.id ? `...${user.id.slice(-8)}` : "—"}
              icon={Hash}
            />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <User size={16} className="text-gray-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">
                  Edit Personal Information
                </h2>
                <p className="text-xs text-gray-400">
                  Update your name and email address
                </p>
              </div>
            </div>

            <form onSubmit={save_profile} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={name}
                    onChange={(e) => {
                      const value = e.target.value;
                      const cleanedValue = value.replace(/[^a-zA-Z\s]/g, "");
                      const formattedValue = cleanedValue.replace(
                        /\b\w/g,
                        (char) => char.toUpperCase(),
                      );

                      set_name(formattedValue);
                    }}
                    required
                    placeholder="Your full name"
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => set_email(e.target.value)}
                      required
                      placeholder="your@email.com"
                      className="w-full pl-9 border border-gray-300 rounded-xl py-2.5 pr-3.5 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Role
                </label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                  <BadgeCheck size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-500 capitalize">
                    {role_labels[user?.role] || user?.role}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">
                    Cannot be changed here
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-gray-400">
                  Changes will be saved to your account immediately
                </p>
                <button
                  type="submit"
                  disabled={saving_profile}
                  className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 disabled:bg-gray-400 transition"
                >
                  <Save size={14} />
                  {saving_profile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Shield size={16} className="text-gray-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">
                  Change Password
                </h2>
                <p className="text-xs text-gray-400">
                  Keep your account secure with a strong password
                </p>
              </div>
            </div>

            <form onSubmit={save_password} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={show_cur ? "text" : "password"}
                    value={cur_pass}
                    onChange={(e) => set_cur_pass(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition"
                  />
                  <button
                    type="button"
                    onClick={() => set_show_cur((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {show_cur ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={show_new ? "text" : "password"}
                      value={new_pass}
                      onChange={(e) => set_new_pass(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition"
                    />
                    <button
                      type="button"
                      onClick={() => set_show_new((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {show_new ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={show_confirm ? "text" : "password"}
                      value={confirm_pass}
                      onChange={(e) => set_confirm_pass(e.target.value)}
                      placeholder="Repeat new password"
                      className={`w-full border rounded-xl px-3.5 py-2.5 pr-10 text-sm outline-none focus:ring-2 transition ${
                        confirm_pass && confirm_pass !== new_pass
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : "border-gray-300 focus:border-gray-900 focus:ring-gray-900/10"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => set_show_confirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {show_confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {confirm_pass && confirm_pass !== new_pass && (
                    <p className="text-xs text-red-500 mt-1">
                      passwords do not match
                    </p>
                  )}
                </div>
              </div>

              {new_pass && (
                <div>
                  <div className="flex gap-1.5 mb-1">
                    {[1, 2, 3, 4].map((lvl) => (
                      <div
                        key={lvl}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          lvl <= pass_strength
                            ? pass_strength <= 1
                              ? "bg-red-400"
                              : pass_strength <= 2
                                ? "bg-yellow-400"
                                : pass_strength <= 3
                                  ? "bg-blue-400"
                                  : "bg-green-500"
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    {pass_strength <= 1
                      ? "Weak"
                      : pass_strength <= 2
                        ? "Fair"
                        : pass_strength <= 3
                          ? "Good"
                          : "Strong"}{" "}
                    password
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-gray-400">
                  Use uppercase, numbers and symbols for a stronger password
                </p>
                <button
                  type="submit"
                  disabled={saving_pass}
                  className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 disabled:bg-gray-400 transition"
                >
                  <Shield size={14} />
                  {saving_pass ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
