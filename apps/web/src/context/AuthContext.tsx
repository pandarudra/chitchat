// AuthContext.tsx - Enhanced version
import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
} from "react";
import type { AuthState, User } from "../types";
import api, { addAuthEventListener, removeAuthEventListener } from "../lib/api";
import axios from "axios";

interface AuthContextType extends AuthState {
  login: (phone: string) => Promise<void>;
  signup: (name: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  clearError: () => void;
  refreshAuth: () => Promise<void>;
}

const be_url = import.meta.env.VITE_BE_URL;
const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: User }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "UPDATE_PROFILE"; payload: User }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_LOADING"; payload: boolean };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case "AUTH_FAILURE":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case "UPDATE_PROFILE":
      return {
        ...state,
        user: action.payload,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const transformUser = useCallback((userData: any): User => {
    return {
      id: userData._id || userData.id,
      phoneNumber: userData.phoneNumber,
      displayName: userData.displayName,
      avatarUrl: userData.avatarUrl,
      status: userData.status,
      lastSeen: userData.lastSeen ? new Date(userData.lastSeen) : undefined,
      isOnline: userData.isOnline || false, // Use the actual isOnline value from database
      createdAt: userData.createdAt ? new Date(userData.createdAt) : undefined,
      updatedAt: userData.updatedAt ? new Date(userData.updatedAt) : undefined,
    };
  }, []);

  const checkAuthStatus = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const res = await api.get(`/api/auth/me`);
      const user = transformUser(res.data.user);
      dispatch({ type: "AUTH_SUCCESS", payload: user });
    } catch (error: any) {
      dispatch({ type: "SET_LOADING", payload: false });
      console.log("Auth check failed:", error?.response?.data?.message);
    }
  }, [transformUser]);

  const handleTokenRefresh = useCallback(() => {
    console.log("Token was refreshed, updating auth state");
    // Optionally refresh user data after token refresh
    // checkAuthStatus();
  }, []);

  const handleLogout = useCallback(async () => {
    await axios.get(`${be_url}/api/auth/logout`, {
      withCredentials: true,
    });
    console.log("Logout triggered by token refresh failure");
    dispatch({ type: "LOGOUT" });
  }, []);

  useEffect(() => {
    // Initial auth check
    checkAuthStatus();

    // Listen for auth events from the API interceptor
    addAuthEventListener("logout", handleLogout);
    addAuthEventListener("tokenRefreshed", handleTokenRefresh);

    // Cleanup listeners on unmount
    return () => {
      removeAuthEventListener("logout", handleLogout);
      removeAuthEventListener("tokenRefreshed", handleTokenRefresh);
    };
  }, [checkAuthStatus, handleLogout, handleTokenRefresh]);

  const login = async (phoneNumber: string) => {
    dispatch({ type: "AUTH_START" });
    try {
      const res = await api.post(`/api/auth/login`, { phoneNumber });
      console.log("Login successful:", res.data);

      // Check auth status after login to get user data
      await checkAuthStatus();
    } catch (error: any) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: error?.response?.data?.message || "Login failed",
      });
      throw error;
    }
  };

  const signup = async (displayName: string, phoneNumber: string) => {
    dispatch({ type: "AUTH_START" });
    try {
      const res = await api.post(`/api/auth/signup`, {
        displayName,
        phoneNumber,
      });
      console.log("Signup successful:", res.data);

      // Check auth status after signup to get user data
      await checkAuthStatus();
    } catch (error: any) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: error?.response?.data?.message || "Signup failed",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axios.get(`${be_url}/api/auth/logout`, {
        withCredentials: true,
      });
      console.log("Logout successful");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch({ type: "LOGOUT" });
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const res = await api.put(`/api/auth/update-profile`, updates);
      const user = transformUser(res.data.user);
      dispatch({ type: "UPDATE_PROFILE", payload: user });
    } catch (error: any) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: error?.response?.data?.message || "Failed to update profile",
      });
      throw error;
    }
  };

  const refreshAuth = async () => {
    await checkAuthStatus();
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signup,
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

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
