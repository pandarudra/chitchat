import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Check, UserPlus, Clock3, X } from "lucide-react";
import { useChat } from "../../context/ChatContext";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../lib/api";
import type { NotificationItem } from "../../types/notification";
import { getAvatarUrl } from "../../utils/constants";

interface NotificationsProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function Notifications({ isOpen, onClose }: NotificationsProps) {
  const { acceptContactRequest, rejectContactRequest } = useChat();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const items = await getNotifications();
      setNotifications(items);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadNotifications();
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  const handleMarkRead = async (notificationId: string) => {
    await markNotificationRead(notificationId);
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notificationId ? { ...item, isRead: true } : item,
      ),
    );
  };

  const handleAccept = async (notification: NotificationItem) => {
    const requestId = String(notification.payload.requestId ?? "");
    if (!requestId) return;

    try {
      setActionLoading(notification.id);
      await acceptContactRequest(requestId);
      await handleMarkRead(notification.id);
      await loadNotifications();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (notification: NotificationItem) => {
    const requestId = String(notification.payload.requestId ?? "");
    if (!requestId) return;

    try {
      setActionLoading(notification.id);
      await rejectContactRequest(requestId);
      await handleMarkRead(notification.id);
      await loadNotifications();
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                Notifications
              </h2>
              <p className="text-xs text-muted-foreground">
                Requests, acceptances, and other updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
              <Bell className="mx-auto mb-2 h-5 w-5 opacity-70" />
              No notifications yet.
            </div>
          ) : (
            notifications.map((notification) => {
              const isRequest = notification.type === "contact_request";
              const actorName = String(
                notification.payload.actorName ?? "Someone",
              );
              const actorAvatar = String(
                notification.payload.actorAvatarUrl ?? "",
              );

              return (
                <div
                  key={notification.id}
                  className={`rounded-2xl border p-4 shadow-sm transition-colors ${notification.isRead ? "border-border bg-background" : "border-primary/20 bg-primary/5"}`}
                  onClick={() =>
                    !notification.isRead && handleMarkRead(notification.id)
                  }
                >
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      {actorAvatar ? (
                        <img
                          src={getAvatarUrl(actorAvatar)}
                          alt={actorName}
                          className="h-12 w-12 rounded-2xl border border-border object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-primary/10 text-sm font-bold text-primary">
                          {actorName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {!notification.isRead && (
                        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-card bg-primary" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-foreground">
                            {notification.title}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                          <Clock3 className="h-3 w-3" />
                          {formatRelativeTime(notification.createdAt)}
                        </div>
                      </div>

                      {isRequest && (
                        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <UserPlus className="h-4 w-4 text-primary" />
                            Pending contact request from {actorName}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleReject(notification)}
                              disabled={actionLoading === notification.id}
                              className="rounded-2xl border border-border bg-muted px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/80 disabled:opacity-60"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAccept(notification)}
                              disabled={actionLoading === notification.id}
                              className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                            >
                              {actionLoading === notification.id
                                ? "Saving..."
                                : "Accept"}
                            </button>
                          </div>
                        </div>
                      )}

                      {!isRequest && (
                        <div className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className="h-3.5 w-3.5" />
                          Tap to mark as read
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
