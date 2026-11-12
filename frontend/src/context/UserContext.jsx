import { createContext, useState } from "react";
import { useNavigate } from "react-router-dom";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const navigate = useNavigate();

  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [role, setRole] = useState(localStorage.getItem("role") || "");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

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
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
