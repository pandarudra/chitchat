/**
 * Auth reducer + action types for AuthContext.
 * Pure — no React imports, no side effects.
 */

import type { AuthState, User } from "../../types/user";

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: User }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "UPDATE_PROFILE"; payload: User }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_LOADING"; payload: boolean };

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

export const authInitialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_START":
      return { ...state, isLoading: true, error: null };

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
      return { ...state, user: action.payload };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Helper — transforms raw server user shape → frontend User type
// ---------------------------------------------------------------------------

export function transformUser(userData: Record<string, any>): User {
  return {
    id: userData._id ?? userData.id,
    email: userData.email,
    displayName: userData.displayName,
    avatarUrl: userData.avatarUrl,
    status: userData.status,
    lastSeen: userData.lastSeen ? new Date(userData.lastSeen) : undefined,
    isOnline: userData.isOnline ?? false,
    createdAt: userData.createdAt ? new Date(userData.createdAt) : undefined,
    updatedAt: userData.updatedAt ? new Date(userData.updatedAt) : undefined,
  };
}
