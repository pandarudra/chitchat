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

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  type: "text" | "image" | "file" | "audio";
  status: "sent" | "delivered" | "read";
  replyTo?: string;
  fileName?: string;
  fileSize?: number;
  mediaUrl?: string;
}
export interface Chat {
  id: string;
  participants: User[];
  lastMessage?: Message;
  messages: Message[];
  isGroup: boolean;
  groupName?: string;
  groupAdmin?: string;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
}
export interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  contacts: User[];
  contactRequests: ContactRequest[];
  isTyping: Record<string, User[]>;
  searchQuery: string;
}

export interface ContactRequest {
  id: string;
  senderId: string;
  receiverId: string;
  senderInfo: User;
  status: "pending" | "accepted" | "rejected";
  timestamp: Date;
}

export interface TypingIndicator {
  chatId: string;
  userId: string;
  isTyping: boolean;
}
