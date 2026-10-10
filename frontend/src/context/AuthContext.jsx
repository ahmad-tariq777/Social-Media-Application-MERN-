import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api";
import { connectSocket, disconnectSocket } from "../utils/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem("token")) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const res = await api.get("/users/me");
      setUser(res.data);
      connectSocket();
      return res.data;
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 404) {
        localStorage.removeItem("token");
        setUser(null);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (email, password) => {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      return refreshUser();
    },
    [refreshUser]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    disconnectSocket();
    setUser(null);
  }, []);

  const updateUser = useCallback((patch) => setUser((prev) => (prev ? { ...prev, ...patch } : prev)), []);

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshUser, updateUser }),
    [user, loading, login, logout, refreshUser, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
