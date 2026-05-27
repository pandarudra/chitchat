import api from "./axiosInstance";
import type {
  ContactRequestItem,
  NotificationItem,
  UserSuggestion,
} from "../types/notification";

export async function searchUserSuggestions(
  query: string,
): Promise<UserSuggestion[]> {
  const res = await api.get("/api/user/suggestions", {
    params: { query },
  });

  return (res.data.suggestions ?? []).map((user: any) => ({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    status: user.status,
    lastSeen: user.lastSeen ? new Date(user.lastSeen) : undefined,
    isOnline: user.isOnline ?? false,
    isContact: user.isContact ?? false,
    requestStatus: user.requestStatus ?? "none",
  }));
}

export async function sendContactRequest(email: string): Promise<void> {
  await api.post("/api/user/add-contact", { contactEmail: email });
}

export async function getContactRequests(): Promise<ContactRequestItem[]> {
  const res = await api.get("/api/user/requests");
  return (res.data.requests ?? []).map((request: any) => ({
    id: request.id,
    senderId: request.senderId,
    receiverId: request.receiverId,
    senderInfo: request.senderInfo
      ? {
          id: request.senderInfo.id,
          email: request.senderInfo.email,
          displayName: request.senderInfo.displayName,
          avatarUrl: request.senderInfo.avatarUrl,
          status: request.senderInfo.status,
          isOnline: request.senderInfo.isOnline ?? false,
          lastSeen: request.senderInfo.lastSeen
            ? new Date(request.senderInfo.lastSeen)
            : undefined,
        }
      : null,
    status: request.status,
    timestamp: new Date(request.timestamp),
  }));
}

export async function acceptContactRequest(requestId: string): Promise<void> {
  await api.post(`/api/user/requests/${requestId}/accept`);
}

export async function rejectContactRequest(requestId: string): Promise<void> {
  await api.post(`/api/user/requests/${requestId}/reject`);
}

export async function getNotifications(): Promise<NotificationItem[]> {
  const res = await api.get("/api/user/notifications");

  return (res.data.notifications ?? []).map((notification: any) => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    payload: notification.payload ?? {},
    createdAt: new Date(notification.createdAt),
    updatedAt: new Date(notification.updatedAt),
  }));
}

export async function markNotificationRead(
  notificationId: string,
): Promise<void> {
  await api.post(`/api/user/notifications/${notificationId}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post("/api/user/notifications/read-all");
}
