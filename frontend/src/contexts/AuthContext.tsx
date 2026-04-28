import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { api, tokenStorage, apiError } from "@/lib/api";
import { profilesApi } from "@/lib/services";
import { Role, User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; role: Role }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      if (tokenStorage.getAccess()) {
        await fetchMe();
      }
      setLoading(false);
    })();
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      const access = data.access_token || data.token;
      const refresh = data.refresh_token;
      if (!access) throw new Error("Сервер не вернул токен");
      tokenStorage.set(access, refresh);
      await fetchMe();
    } catch (e) {
      throw new Error(apiError(e));
    }
  };

  const register = async (payload: { email: string; password: string; name: string; role: Role }) => {
    try {
      await api.post("/auth/register", payload);
      await login(payload.email, payload.password);
      // Автоматически заполняем имя в профиле после регистрации
      await profilesApi.update({ name: payload.name, bio: "", skills: "" });
      await fetchMe();
    } catch (e) {
      throw new Error(apiError(e));
    }
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    tokenStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
