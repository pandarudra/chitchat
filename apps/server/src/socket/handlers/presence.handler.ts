import { Socket, Server as SocketIOServer } from "socket.io";
import { UserModel } from "../../models/User";
import { pub } from "../../utils/redisClient";
import { socketKey } from "../../lib/ext";
import { Logger } from "../../utils/logger";

// ---------------------------------------------------------------------------
// User presence — online status broadcasting
// ---------------------------------------------------------------------------

/**
 * Notifies all online contacts of a user about their new online/offline status.
 */
async function broadcastStatusChange(
  io: SocketIOServer,
  userId: string,
  isOnline: boolean
): Promise<void> {
  try {
    const user = await UserModel.findById(userId).populate(
      "contacts.user",
      "_id"
    );
    if (!user) return;

    // Gather all contacts that need the notification:
    // – users in this user's own contacts list
    // – users who have this user in their contacts list
    const ownContactIds = user.contacts.map((c) => c.user.toString());
    const reverseContacts = await UserModel.find(
      { "contacts.user": userId },
      "_id"
    );
    const reverseContactIds = reverseContacts.map((u) => (u._id as any).toString());

    const uniqueContactIds = [...new Set([...ownContactIds, ...reverseContactIds])];

    for (const contactId of uniqueContactIds) {
      const contactSocketId = await pub.get(socketKey(contactId));
      if (contactSocketId) {
        io.to(contactSocketId).emit("user_status_change", {
          userId,
          isOnline,
          lastSeen: new Date(),
        });
      }
    }

    Logger.debug(
      `Status broadcast: ${userId} is now ${isOnline ? "online" : "offline"} — notified ${uniqueContactIds.length} contacts.`
    );
  } catch (error) {
    Logger.error("Error broadcasting user status change", error);
  }
}

// ---------------------------------------------------------------------------
// Handler registration
// ---------------------------------------------------------------------------

/**
 * Registers presence-related socket handlers: heartbeat and disconnect.
 * Also broadcasts the user's new online status to their contacts on connection.
 */
export function registerPresenceHandlers(
  io: SocketIOServer,
  socket: Socket,
  userId: string
): void {
  // ── heartbeat ─────────────────────────────────────────────────────────────
  // Client sends this periodically to refresh the Redis TTL and lastSeen timestamp.
  socket.on("heartbeat", async () => {
    try {
      await Promise.all([
        UserModel.findByIdAndUpdate(userId, { lastSeen: new Date() }),
        pub.expire(socketKey(userId), 60 * 10), // Reset 10-minute TTL
      ]);
    } catch (error) {
      Logger.error("Error handling heartbeat", error);
    }
  });

  // ── disconnect ────────────────────────────────────────────────────────────
  socket.on("disconnect", async () => {
    Logger.info(`User disconnected: ${userId} (socket: ${socket.id})`);

    try {
      await Promise.all([
        UserModel.findByIdAndUpdate(userId, { lastSeen: new Date(), isOnline: false }),
        pub.del(socketKey(userId)),
      ]);

      await broadcastStatusChange(io, userId, false);
    } catch (error) {
      Logger.error("Error handling disconnect", error);
    }
  });
}

/**
 * Marks the user as online in both MongoDB and Redis, then notifies contacts.
 * Called once when a socket successfully connects and authenticates.
 */
export async function handleUserConnected(
  io: SocketIOServer,
  socket: Socket,
  userId: string
): Promise<void> {
  try {
    await Promise.all([
      UserModel.findByIdAndUpdate(userId, { lastSeen: new Date(), isOnline: true }),
      pub.set(socketKey(userId), socket.id, "EX", 60 * 10),
    ]);

    socket.emit("connected", { socketId: socket.id });
    await broadcastStatusChange(io, userId, true);

    Logger.info(`User connected: ${userId} (socket: ${socket.id})`);
  } catch (error) {
    Logger.error("Error handling user connection", error);
  }
}
