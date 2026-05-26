import type { User } from "./user";
import type { Message } from "./message";
import type { CallState } from "./call";

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
  isAI?: boolean;
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
