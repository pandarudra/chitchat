export interface User {
  id: string; // This will be the MongoDB _id converted to string
  phoneNumber: string;
  displayName: string;
  avatarUrl?: string;
  status?: string;
  lastSeen?: Date;
  isOnline: boolean; // This should be computed on frontend based on lastSeen
  createdAt?: Date;
  updatedAt?: Date;
}
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
