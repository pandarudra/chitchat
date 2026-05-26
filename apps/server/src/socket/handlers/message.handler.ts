import { Socket, Server as SocketIOServer } from "socket.io";
import { MessageModel } from "../../models/Message";
import { UserModel } from "../../models/User";
import { pub, sub } from "../../utils/redisClient";
import { socketKey } from "../../lib/ext";
import { Logger } from "../../utils/logger";

// ---------------------------------------------------------------------------
// One-to-one messaging
// ---------------------------------------------------------------------------

/**
 * Registers the direct message socket events for the connected user.
 */
export function registerMessageHandlers(
  _io: SocketIOServer,
  socket: Socket,
  userId: string
): void {
  // ── one_to_one_message ────────────────────────────────────────────────────
  socket.on("one_to_one_message", async (data) => {
    const { to, message } = data;

    if (!to || !message) {
      Logger.warn(`Invalid one_to_one_message payload from ${userId}`);
      return;
    }

    // Refresh sender's lastSeen in the background — don't await to keep latency low
    UserModel.findByIdAndUpdate(userId, { lastSeen: new Date() }).catch((err) =>
      Logger.error("Failed to update sender lastSeen", err)
    );

    const enrichedPayload = {
      from: userId,
      to,
      message,
      timestamp: new Date().toISOString(),
      mediaUrl: data.mediaUrl,
      duration: data.duration,
      type: data.type,
    };

    await pub.publish("CHITCHAT", JSON.stringify(enrichedPayload));
  });

  // ── seen_message ──────────────────────────────────────────────────────────
  socket.on("seen_message", async (data) => {
    const { from, to } = data;

    if (!from || !to) {
      Logger.warn("Invalid seen_message payload — from/to required.");
      return;
    }

    try {
      const unseenMessages = await MessageModel.find({ from, to, seen: false });

      if (unseenMessages.length === 0) {
        Logger.debug(`No unseen messages from ${from} to ${to}.`);
        return;
      }

      await MessageModel.updateMany(
        { from, to, seen: false },
        { $set: { seen: true, seenAt: new Date() } }
      );

      // Notify the original sender that their messages were read
      const senderSocketId = await pub.get(socketKey(to));
      if (senderSocketId) {
        socket.to(senderSocketId).emit("seen_message", { from, to, seen: true });
        Logger.debug(`Seen receipt sent to ${to}.`);
      }
    } catch (error) {
      Logger.error("Error processing seen_message", error);
    }
  });
}

// ---------------------------------------------------------------------------
// Redis pub/sub consumer
// Processes messages published to the CHITCHAT channel and delivers them
// to the recipient's socket (or persists them as undelivered).
// ---------------------------------------------------------------------------

/**
 * Subscribes to the CHITCHAT Redis channel and sets up the message consumer.
 * Must be called once after the SocketService is initialised.
 */
export function startMessageConsumer(io: SocketIOServer): void {
  sub.subscribe("CHITCHAT");

  sub.on("message", async (_channel, raw) => {
    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      Logger.error("Failed to parse CHITCHAT message from Redis");
      return;
    }

    const { from, to, message, timestamp } = data;

    if (!from || !to || !message) {
      Logger.warn("Received incomplete CHITCHAT message — skipping.");
      return;
    }

    try {
      const recipient = await UserModel.findOne({ email: to });
      if (!recipient) {
        Logger.warn(`Recipient not found for email: ${to}`);
        return;
      }

      const recipientId = recipient._id;
      const isBlocked = recipient.blockedContacts?.some(
        (b) => b.toString() === from
      ) ?? false;

      // Determine media type and path
      const isAudio = data.mediaUrl?.endsWith(".webm");
      const isVideoOrImage = data.type === "video" || data.type === "image";
      const mediaPath = isAudio || isVideoOrImage ? data.mediaUrl : undefined;

      const messageDoc: any = {
        from,
        to: recipientId,
        content: message,
        delivered: false,
        seen: false,
        timestamp: new Date(timestamp),
        blocked: isBlocked,
      };

      if (mediaPath) {
        messageDoc.path = mediaPath;
        messageDoc.type =
          data.type === "video" || data.type === "image" ? data.type : "audio";
        if (data.type === "audio") {
          messageDoc.duration = data.duration ?? 0;
        }
      }

      const newMsg = await MessageModel.create(messageDoc);

      if (isBlocked) {
        // Message stored but not delivered to a blocking recipient
        return;
      }

      const recipientSocketId = await pub.get(socketKey((recipientId as any).toString()));
      const sender = await UserModel.findById(from);

      const deliveryPayload = {
        fromId: from,
        senderEmail: sender?.email,
        senderName: sender?.displayName,
        toId: (recipientId as any).toString(),
        recipientEmail: to,
        message: newMsg,
      };

      if (recipientSocketId) {
        io.to(recipientSocketId).emit("one_to_one_message", deliveryPayload);
        newMsg.delivered = true;
        await newMsg.save();
        Logger.debug(`Message delivered from ${from} to ${to}.`);
      } else {
        Logger.debug(`User ${to} offline — message stored for later delivery.`);
      }
    } catch (error) {
      Logger.error("Error processing CHITCHAT pub/sub message", error);
    }
  });
}
