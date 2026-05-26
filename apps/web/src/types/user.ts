/** Represents an authenticated user in the system. */
export interface User {
  /** MongoDB _id converted to string. */
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  status?: string;
  lastSeen?: Date;
  isOnline: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  /** True if this user has blocked the current logged-in user. */
  isBlocked?: boolean;
  /** True if this entry represents the AI bot (Susi). */
  isAI?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
