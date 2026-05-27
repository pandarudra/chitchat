export interface NotificationPayload {
  requestId?: string;
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  actorAvatarUrl?: string | null;
  [key: string]: unknown;
}

export interface NotificationItem {
  id: string;
  type:
    | "contact_request"
    | "contact_request_accepted"
    | "contact_request_rejected"
    | "system";
  title: string;
  message: string;
  isRead: boolean;
  payload: NotificationPayload;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactRequestItem {
  id: string;
  senderId: string;
  receiverId: string;
  senderInfo: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    status?: string;
    isOnline: boolean;
    lastSeen?: Date;
  } | null;
  status: "pending" | "accepted" | "rejected";
  timestamp: Date;
}

export interface UserSuggestion {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  status?: string;
  lastSeen?: Date;
  isOnline: boolean;
  isContact: boolean;
  requestStatus: "none" | "sent" | "received";
}
