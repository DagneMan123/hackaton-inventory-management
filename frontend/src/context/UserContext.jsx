import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const navigate = useNavigate();

  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
  const [role, setRole] = useState(() => {
    const savedRole = localStorage.getItem("role");
    if (savedRole) return savedRole;
    try {
      const savedUser = JSON.parse(localStorage.getItem("user") || "null");
      return savedUser?.role || "";
    } catch {
      return "";
    }
  });
  const [loading, setLoading] = useState(!!localStorage.getItem("token"));

  const saveToken = (t) => {
    setToken(t);
    if (t) localStorage.setItem("token", t);
    else localStorage.removeItem("token");
  };

  const saveRole = (r) => {
    setRole(r);
    if (r) localStorage.setItem("role", r);
    else localStorage.removeItem("role");
  };

  const saveUser = (u) => {
    setUser(u);
    if (u) localStorage.setItem("user", JSON.stringify(u));
    else localStorage.removeItem("user");
  };

  const logout = () => {
    saveToken("");
    saveRole("");
    saveUser(null);
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const verifyUser = async () => {
      const currentToken = localStorage.getItem("token");
      if (!currentToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${backendUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        if (res.data?.success && res.data?.user) {
          saveUser(res.data.user);
          saveRole(res.data.user.role);
        } else {
          logout();
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, [backendUrl]);

  return (
    <UserContext.Provider
      value={{
        backendUrl,
        navigate,
        token,
        setToken: saveToken,
        role,
        setRole: saveRole,
        user,
        setUser: saveUser,
        loading,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
