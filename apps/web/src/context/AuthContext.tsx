import React, { createContext, useContext, useEffect, useReducer } from "react";
import type { AuthState, User } from "../types";
import axios from "axios";

interface AuthContextType extends AuthState {
  login: (phone: string) => Promise<void>;
  signup: (name: string, phone: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  clearError: () => void;
}

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

const be_url = import.meta.env.VITE_BE_URL;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const res = await axios.get(`${be_url}/api/auth/me`, {
        withCredentials: true,
      });

      // Transform backend user data to frontend format
      const user: User = {
        id: res.data.user._id || res.data.user.id,
        phoneNumber: res.data.user.phoneNumber,
        displayName: res.data.user.displayName,
        avatarUrl: res.data.user.avatarUrl,
        status: res.data.user.status,
        lastSeen: res.data.user.lastSeen
          ? new Date(res.data.user.lastSeen)
          : undefined,
        isOnline: res.data.user.lastSeen
          ? new Date().getTime() - new Date(res.data.user.lastSeen).getTime() <
            5 * 60 * 1000
          : false,
        createdAt: res.data.user.createdAt
          ? new Date(res.data.user.createdAt)
          : undefined,
        updatedAt: res.data.user.updatedAt
          ? new Date(res.data.user.updatedAt)
          : undefined,
      };

      dispatch({
        type: "AUTH_SUCCESS",
        payload: user,
      });
    } catch (error) {
      console.error("Error checking auth status:", error);
      dispatch({
        type: "SET_LOADING",
        payload: false,
      });
    }
  };

  const login = async (phoneNumber: string) => {
    dispatch({ type: "AUTH_START" });
    try {
      const res = await axios.post(
        `${be_url}/api/auth/login`,
        { phoneNumber },
        { withCredentials: true }
      );

      // Transform and dispatch user data
      checkAuthStatus();
    } catch (error: any) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: error?.response?.data?.message || "Login failed",
      });
    }
  };

  const signup = async (displayName: string, phoneNumber: string) => {
    dispatch({ type: "AUTH_START" });
    try {
      const res = await axios.post(
        `${be_url}/api/auth/signup`,
        { displayName, phoneNumber },
        { withCredentials: true }
      );

      console.log("Signup response:", res.data);
      // Transform and dispatch user data
      checkAuthStatus();
    } catch (error: any) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: error?.response?.data?.message || "Signup failed",
      });
    }
  };

  const logout = async () => {
    try {
      await axios.post(
        `${be_url}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch({ type: "LOGOUT" });
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const res = await axios.put(
        `${be_url}/api/auth/update-profile`,
        updates,
        {
          withCredentials: true,
        }
      );

      // Transform and dispatch updated user data
      const user: User = {
        id: res.data.user._id || res.data.user.id,
        phoneNumber: res.data.user.phoneNumber,
        displayName: res.data.user.displayName,
        avatarUrl: res.data.user.avatarUrl,
        status: res.data.user.status,
        lastSeen: res.data.user.lastSeen
          ? new Date(res.data.user.lastSeen)
          : undefined,
        isOnline: res.data.user.lastSeen
          ? new Date().getTime() - new Date(res.data.user.lastSeen).getTime() <
            5 * 60 * 1000
          : false,
        createdAt: res.data.user.createdAt
          ? new Date(res.data.user.createdAt)
          : undefined,
        updatedAt: res.data.user.updatedAt
          ? new Date(res.data.user.updatedAt)
          : undefined,
      };

      dispatch({ type: "UPDATE_PROFILE", payload: user });
    } catch (error: any) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: error?.response?.data?.message || "Failed to update profile",
      });
    }
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
