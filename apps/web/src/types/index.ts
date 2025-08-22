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
  isBlocked?: boolean; // Indicates if the user has blocked the current user
  isAI?: boolean; // Indicates if this is an AI bot
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
  type: "text" | "image" | "file" | "audio" | "video";
  status: "sent" | "delivered" | "read";
  replyTo?: string;
  fileName?: string;
  fileSize?: number;
  mediaUrl?: string;
  duration?: number; // Duration in seconds for audio messages
  isBlocked?: boolean; // Indicates if the message is from a blocked contact
  isPinned?: boolean; // Indicates if the message is pinned in the chat
  isAIMessage?: boolean; // Indicates if this is an AI-generated message
}

export type CallState = {
  callId: string | null;
  status:
    | "idle"
    | "calling"
    | "ringing"
    | "connected"
    | "ended"
    | "declined"
    | "missed"
    | "timeout";
  callType: "audio" | "video" | null;
  peerConnection: RTCPeerConnection | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  caller: User | null;
  callee: User | null;
};

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
  isBlocked?: boolean;
  isAI?: boolean; // Indicates if this is an AI chat
}
export interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  contacts: User[];
  contactRequests: ContactRequest[];
  isTyping: Record<string, User[]>;
  searchQuery: string;
  call: CallState;
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

export interface CallHistory {
  id: string;
  callId: string;
  type: "audio" | "video";
  status: "completed" | "missed" | "declined" | "failed";
  direction: "incoming" | "outgoing";
  duration: number; // in seconds
  timestamp: Date;
  startTime: Date;
  endTime?: Date;
  user: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    phoneNumber: string;
  };
}

export interface AIBot {
  botId: string;
  name: string;
  avatarUrl?: string;
  status: string;
  provider: "gemini";
  isActive: boolean;
  systemPrompt?: string;
}
