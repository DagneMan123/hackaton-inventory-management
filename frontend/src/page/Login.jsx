import React, { useContext, useState } from "react";
import { FaEnvelope, FaEye, FaEyeSlash, FaLock, FaUser } from "react-icons/fa";
import { Link } from "react-router-dom";
import axios from "axios";
import { UserContext } from "../context/UserContext";
import { toast } from "react-toastify";
import logo  from "../assets/kelem.png"

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {backendUrl, setToken, setRole, setUser, navigate} = useContext(UserContext);

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setLoading(false);
      return setError("Email Address is required.");
    }
    if (!password.trim()) {
      setLoading(false);
      return setError("Password is required.");
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.post(backendUrl + "/api/auth/login", {
        email,
        password,
      });

      if (response.data.success) {
        setToken(response.data.token);
        setRole(response.data.user.role);
        setUser(response.data.user);
        toast.success("Login successful");

        navigate(response.data.redirectTo || "/");
      } else {
        setError(response.data.message);
        setEmail("");
        setPassword("");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Something went wrong");
      console.log(error);

      setEmail("");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <img className="w-15 mx-auto my-7" src={logo} />
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
         <span className="text-blue-600">qelem medda</span> inventory 
        </h2>

        {error && (
          <div
            className="mb-4 rounded-lg border border-red-900 bg-red-600 text-white px-4 py-3"
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={onSubmitHandler} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <FaEnvelope />
              </span>

              <input
                type="email"
                name="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <FaLock />
              </span>

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />

              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>
      
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-linear-to-r 
            from-amber-400
            to-black
             text-white font-semibold text-lg shadow-md hover:opacity-90 transition disabled:opacity-70"
          >
            {loading ? "Logging in..." : "LOG IN →"}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

       
      </div>
    </div>
  );
}

export default Login;

