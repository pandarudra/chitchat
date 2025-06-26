"use client";

import axios from "axios";
import React, { createContext } from "react";
import api from "../utils/axios";

interface AuthProviderProps {
  children: React.ReactNode;
}

export interface IAuthContext {
  isAuthenticated: boolean;
  loading?: boolean;
  user?: any;
  SignUp: (phoneNumber: string, displayName: string) => Promise<void>;
  Login: (phoneNumber: string) => Promise<void>;
  Logout: () => Promise<void>;
}

export const AuthContext = createContext<IAuthContext | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    async function checkAuth() {
      try {
        const res = await axios.get(`http://localhost:8000/api/auth/me`, {
          withCredentials: true,
        });
        setIsAuthenticated(true);
        setUser(res.data.user);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [user]);

  const SignUp = React.useCallback(
    async (phoneNumber: string, displayName: string) => {
      try {
        const res = await api.post(`/api/auth/signup`, {
          phoneNumber,
          displayName,
        });
        return res.data; // Return the response data for further processing if needed
      } catch (error) {
        console.error("SignUp failed:", error);
        throw new Error("SignUp failed. Please try again.");
      }
    },
    []
  );

  const Login = React.useCallback(async (phoneNumber: string) => {
    try {
      const res = await api.post(`/api/auth/login`, { phoneNumber });
      console.log("Login response:", res.data);
    } catch (error) {
      console.error("Login failed:", error);
      throw new Error("Login failed. Please try again.");
    }
  }, []);

  const Logout = React.useCallback(async () => {
    try {
      const res = await api.get(`/api/auth/logout`);
      console.log("Logout response:", res.data);
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      throw new Error("Logout failed. Please try again.");
    }
  }, []);

  const value = React.useMemo(
    () => ({
      isAuthenticated,
      loading,
      user,
      SignUp,
      Login,
      Logout,
    }),
    [isAuthenticated, loading, user, SignUp, Login, Logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
