import Cookies from "js-cookie";
import { JwtResponse, Role } from "@/types/api";

const TOKEN_KEY = "token";
const USER_KEY = "user";

export interface StoredUser {
  username: string;
  role: Role;
}

// ─── Token ────────────────────────────────────────────────────────────────────

export const setAuth = (data: JwtResponse): void => {
  Cookies.set(TOKEN_KEY, data.token, { expires: 1, sameSite: "strict" });
  Cookies.set(USER_KEY, JSON.stringify({ username: data.username, role: data.role }), {
    expires: 1,
    sameSite: "strict",
  });
};

export const clearAuth = (): void => {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(USER_KEY);
};

export const getToken = (): string | undefined => {
  return Cookies.get(TOKEN_KEY);
};

export const getUser = (): StoredUser | null => {
  const raw = Cookies.get(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const isAdmin = (): boolean => {
  return getUser()?.role === "ADMIN";
};