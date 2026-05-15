import { createContext, useContext, ReactNode } from "react";
import { useGetMe, useLogin, useLogout, useRegister, getGetMeQueryKey } from "@workspace/api-client-react";
import type { User, LoginInput, RegisterInput } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getToken(): string | null {
  return localStorage.getItem("token");
}

function setToken(t: string) {
  localStorage.setItem("token", t);
}

function clearToken() {
  localStorage.removeItem("token");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const hasToken = !!getToken();

  const {
    data: user,
    isLoading: isUserLoading,
    error: meError,
  } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: hasToken,
      retry: false,
      staleTime: 60_000,
    }
  });

  // If the /auth/me endpoint returns 401 (invalid/expired token), clear localStorage
  if (meError) {
    const status = (meError as { status?: number }).status ?? (meError as { response?: { status?: number } }).response?.status;
    if (status === 401) {
      clearToken();
      queryClient.removeQueries({ queryKey: getGetMeQueryKey() });
    }
  }

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  const login = async (data: LoginInput) => {
    const res = await loginMutation.mutateAsync({ data });
    setToken(res.token);
    // Manually populate the cache with the returned user so the app
    // redirects immediately without waiting for a refetch round-trip.
    queryClient.setQueryData(getGetMeQueryKey(), res.user);
    setLocation(res.user.role === "admin" ? "/admin" : "/dashboard");
  };

  const register = async (data: RegisterInput) => {
    const res = await registerMutation.mutateAsync({ data });
    setToken(res.token);
    queryClient.setQueryData(getGetMeQueryKey(), res.user);
    setLocation("/dashboard");
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      clearToken();
      queryClient.clear();
      setLocation("/login");
    }
  };

  // isLoading is true only while the /me request is in-flight (when a token exists).
  // It is false immediately when there is no token.
  const isLoading = hasToken
    ? (isUserLoading || loginMutation.isPending || registerMutation.isPending)
    : (loginMutation.isPending || registerMutation.isPending);

  const currentUser = user || null;
  const isAdmin = currentUser?.role === "admin";

  return (
    <AuthContext.Provider value={{
      user: currentUser,
      isLoading,
      isAuthenticated: !!currentUser,
      login,
      register,
      logout,
      isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
