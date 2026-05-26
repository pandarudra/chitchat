import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
} from "react";
import type { AuthState, User } from "../types/user";
import api, { addAuthEventListener, removeAuthEventListener } from "../lib/api";
import {
  authReducer,
  authInitialState,
  transformUser,
} from "./auth/authReducer";

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

interface AuthContextType extends AuthState {
  login: (email: string) => Promise<void>;
  signup: (name: string, email: string) => Promise<void>;
  requestOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User> | Record<string, unknown>) => Promise<void>;
  clearError: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, authInitialState);

  // ── Auth checks ────────────────────────────────────────────────────────────

  const checkAuthStatus = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const res = await api.get("/api/auth/me");
      dispatch({ type: "AUTH_SUCCESS", payload: transformUser(res.data.user) });
    } catch {
      // Not logged in — silently reset loading flag
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  // ── API interceptor event listeners ───────────────────────────────────────

  const handleLogout = useCallback(() => {
    dispatch({ type: "LOGOUT" });
  }, []);

  const handleTokenRefreshed = useCallback(() => {
    // Axios interceptor already retried the request — nothing to do here
  }, []);

  useEffect(() => {
    checkAuthStatus();
    addAuthEventListener("logout", handleLogout);
    addAuthEventListener("tokenRefreshed", handleTokenRefreshed);
    return () => {
      removeAuthEventListener("logout", handleLogout);
      removeAuthEventListener("tokenRefreshed", handleTokenRefreshed);
    };
  }, [checkAuthStatus, handleLogout, handleTokenRefreshed]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const requestOtp = async (email: string): Promise<void> => {
    try {
      await api.post("/api/otp/send", { email });
    } catch (error: any) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: error?.response?.data?.error ?? "Failed to send OTP.",
      });
      throw error;
    }
  };

  const verifyOtp = async (email: string, otp: string): Promise<void> => {
    try {
      await api.post("/api/otp/verify", { email, otp });
    } catch (error: any) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: error?.response?.data?.error ?? "Invalid OTP.",
      });
      throw error;
    }
  };

  const login = async (email: string): Promise<void> => {
    dispatch({ type: "AUTH_START" });
    try {
      await api.post("/api/auth/login", { email });
      await checkAuthStatus();
    } catch (error: any) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: error?.response?.data?.error ?? "Login failed.",
      });
      throw error;
    }
  };

  const signup = async (displayName: string, email: string): Promise<void> => {
    dispatch({ type: "AUTH_START" });
    try {
      await api.post("/api/auth/signup", { displayName, email });
      await checkAuthStatus();
    } catch (error: any) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: error?.response?.data?.error ?? "Signup failed.",
      });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      dispatch({ type: "LOGOUT" });
    }
  };

  const updateProfile = async (
    updates: Partial<User> | Record<string, unknown>
  ): Promise<void> => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      // Payload already contains server-shaped user data — transform directly
      if ("_id" in updates || "email" in updates) {
        dispatch({
          type: "UPDATE_PROFILE",
          payload: transformUser(updates as Record<string, any>),
        });
      } else {
        const res = await api.put("/api/user/profile", updates);
        dispatch({
          type: "UPDATE_PROFILE",
          payload: transformUser(res.data.user),
        });
      }
    } catch (error: any) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: error?.response?.data?.error ?? "Failed to update profile.",
      });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const refreshAuth = async (): Promise<void> => {
    await checkAuthStatus();
  };

  const clearError = (): void => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  // ── Context value ─────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signup,
        requestOtp,
        verifyOtp,
        logout,
        updateProfile,
        clearError,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
