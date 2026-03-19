import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { setAuth, clearAuth, getUser, isAuthenticated, isAdmin, StoredUser } from "@/lib/auth";
import { LoginRequest, RegisterRequest } from "@/types/api";
import { AxiosError } from "axios";

interface UseAuthReturn {
  user: StoredUser | null;
  loading: boolean;
  error: string | null;
  authenticated: boolean;
  admin: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login(data);
      setAuth(response);
      setUser({ username: response.username, role: response.role });
      router.push("/");
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      setError(axiosError.response?.data?.message ?? "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const register = useCallback(async (data: RegisterRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.register(data);
      setAuth(response);
      setUser({ username: response.username, role: response.role });
      router.push("/");
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      setError(axiosError.response?.data?.message ?? "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    router.push("/login");
  }, [router]);

  return {
    user,
    loading,
    error,
    authenticated: isAuthenticated(),
    admin: isAdmin(),
    login,
    register,
    logout,
  };
}