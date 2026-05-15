import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useGetMe, useLogin, useLogout, useRegister, getGetMeQueryKey } from "@workspace/api-client-react";
import type { User, LoginInput, RegisterInput } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [, setLocation] = useLocation();

  const { data: user, isLoading: isUserLoading, refetch } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: !!token,
      retry: false,
    }
  });

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  const login = async (data: LoginInput) => {
    const res = await loginMutation.mutateAsync({ data });
    localStorage.setItem("token", res.token);
    setToken(res.token);
    await refetch();
    setLocation("/dashboard");
  };

  const register = async (data: RegisterInput) => {
    const res = await registerMutation.mutateAsync({ data });
    localStorage.setItem("token", res.token);
    setToken(res.token);
    await refetch();
    setLocation("/dashboard");
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      localStorage.removeItem("token");
      setToken(null);
      setLocation("/login");
    }
  };

  const isLoading = isUserLoading || loginMutation.isPending || registerMutation.isPending || logoutMutation.isPending;
  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
