import { Server as SocketIOServer } from "socket.io";
import { Server as httpServer } from "http";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";
import { MessageModel } from "../models/Message";
import { UserModel } from "../models/User";
import { pub, sub } from "../utils/redisClient";
import { socketKey } from "../lib/ext";
import { CallHistoryModel } from "../models/CallHistory";

dotenv.config();

const CALL_STATES = {
  CALLING: "calling",
  RINGING: "ringing",
  CONNECTED: "connected",
  ENDED: "ended",
  DECLINED: "declined",
  MISSED: "missed",
} as const;

export class SocketService {
  private _io: SocketIOServer;

  constructor(server: httpServer) {
    this._io = new SocketIOServer(server, {
      cors: {
        origin: "http://localhost:5173", // must match your frontend
        credentials: true, // <--- add this line
      },
      transports: ["websocket", "polling"],
    });

    // JWT Authentication Middleware
    this._io.use((socket, next) => {
      const cookies = socket.handshake.headers.cookie;
      if (!cookies) return next(new Error("No cookies found."));

      // console.log("cookies:", cookies);
      const parsedCookies = cookie.parse(cookies);
      const token = parsedCookies.token;
      // console.log("Parsed token:", token);

      if (!token) return next(new Error("Authentication token is required."));

      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
          userId: string;
        };
        socket.data.userId = payload.userId;
        return next();
      } catch {
        return next(new Error("Invalid or expired token."));
      }
    });

    sub.subscribe("CHITCHAT");
  }

  // Helper function to find user by ID or phone number
  private async findUserByIdOrPhone(identifier: string) {
    try {
      // First try to find by ID
      let user = await UserModel.findById(identifier);
      if (user) return user;

      // If not found by ID, try by phone number
      user = await UserModel.findOne({ phoneNumber: identifier });
      return user;
    } catch (error) {
      console.error("Error finding user:", error);
      return null;
    }
  }

  public initListeners(): void {
    const io = this._io;

    io.on("connection", async (socket) => {
      const userId = socket.data.userId;
      console.log(`New connection: ${userId} with socket ID: ${socket.id}`);
      if (!userId) {
        console.error("User ID not found in socket data.");
        return;
      }

      console.log(`New connection: ${userId} with socket ID: ${socket.id}`);

      // Update user's lastSeen and set as online
      try {
        await UserModel.findByIdAndUpdate(userId, {
          lastSeen: new Date(),
          isOnline: true,
        });

        // Broadcast user online status to contacts
        await this.broadcastUserStatusChange(userId.toString(), true);
      } catch (error) {
        console.error("Error updating user lastSeen:", error);
      }

      // redis map upload userId -> socketId
      await pub.set(socketKey(userId), socket.id, "EX", 60 * 10); // Store socket ID in Redis with a TTL of 10 mins
      socket.emit("connected", { socketId: socket.id });

      console.log(`User connected: ${userId} with socket ID: ${socket.id}`);

      // Call-user event - Enhanced to handle both ID and phone number
      socket.on("call-user", async (data) => {
        const {
          to,
          toPhone,
          callId,
          offer,
          callType,
          from,
          fromName,
          fromPhone,
        } = data;

        if (!callId || !offer || !callType || !from) {
          console.error("Invalid call-user data:", data);
          socket.emit("call-error", { callId, message: "Invalid call data" });
          return;
        }

        try {
          // Try to find recipient by ID first, then by phone number
          let recipient = null;
          if (to) {
            recipient = await this.findUserByIdOrPhone(to);
          }
          if (!recipient && toPhone) {
            recipient = await this.findUserByIdOrPhone(toPhone);
          }

          if (!recipient) {
            console.error(`Recipient not found: ${to || toPhone}`);
            socket.emit("call-error", { callId, message: "User not found" });
            return;
          }

          const recipientId = (recipient as any)._id.toString();

          // Check if caller is blocked by recipient
          if (recipient.blockedContacts?.includes(from)) {
            console.log(`Call blocked: ${from} is blocked by ${recipientId}`);
            socket.emit("call-error", {
              callId,
              message: "User has blocked you",
            });
            return;
          }

          const recipientSocketId = await pub.get(socketKey(recipientId));
          if (!recipientSocketId) {
            console.log(`User ${recipientId} is not online for call`);
            socket.emit("call-error", {
              callId,
              message: "User is not online",
            });
            return;
          }

          // Store call data in Redis
          const callData = {
            callId,
            caller: from,
            callee: recipientId,
            callType,
            status: CALL_STATES.CALLING,
            startTime: Date.now(),
          };
          await pub.setex(`call:${callId}`, 300, JSON.stringify(callData));

          // Get caller info
          const caller = await UserModel.findById(from);

          // Send incoming call with enhanced data
          io.to(recipientSocketId).emit("incoming-call", {
            callId,
            from,
            fromName: fromName || caller?.displayName || "Unknown",
            fromPhone: fromPhone || caller?.phoneNumber || "",
            callType,
            offer,
          });

          socket.emit("call-initiated", { callId, to: recipientId });
          console.log(
            `📞 Call initiated: ${callId} from ${from} to ${recipientId}`
          );
        } catch (error) {
          console.error("Error initiating call:", error);
          socket.emit("call-error", {
            callId,
            message: "Failed to initiate call",
          });
        }
      });

      // Accept-call event - Enhanced with better user identification
      socket.on("accept-call", async (data) => {
        const { callId, answer, to, toPhone, from, fromPhone } = data;

        if (!callId || !answer) {
          console.error("Invalid accept-call data:", data);
          socket.emit("call-error", { callId, message: "Invalid accept data" });
          return;
        }

        try {
          const callDataStr = await pub.get(`call:${callId}`);
          if (!callDataStr) {
            console.error(`Call not found: ${callId}`);
            socket.emit("call-error", { callId, message: "Call not found" });
            return;
          }

          const callData = JSON.parse(callDataStr);
          callData.status = CALL_STATES.CONNECTED;
          callData.acceptedAt = Date.now();
          await pub.setex(`call:${callId}`, 300, JSON.stringify(callData));

          // Find caller by multiple methods
          let callerSocketId = null;
          if (to) {
            callerSocketId = await pub.get(socketKey(to));
          }
          if (!callerSocketId && callData.caller) {
            callerSocketId = await pub.get(socketKey(callData.caller));
          }

          if (callerSocketId) {
            io.to(callerSocketId).emit("call-accepted", {
              callId,
              answer,
              from: userId,
            });
            console.log(`✅ Call accepted: ${callId} - notified caller`);
          } else {
            console.log(`Caller not online for call: ${callId}`);
            socket.emit("call-error", { callId, message: "Caller not online" });
          }
        } catch (error) {
          console.error("Error accepting call:", error);
          socket.emit("call-error", {
            callId,
            message: "Failed to accept call",
          });
        }
      });

      // Decline-call event - Enhanced
      socket.on("decline-call", async (data) => {
        const { callId, to, toPhone } = data;

        if (!callId) {
          console.error("Invalid decline-call data:", data);
          socket.emit("call-error", {
            callId,
            message: "Invalid decline data",
          });
          return;
        }

        try {
          const callDataStr = await pub.get(`call:${callId}`);
          if (!callDataStr) {
            console.error(`Call not found: ${callId}`);
            return;
          }

          const callData = JSON.parse(callDataStr);
          callData.status = CALL_STATES.DECLINED;
          callData.endTime = Date.now();
          await pub.setex(`call:${callId}`, 60, JSON.stringify(callData));

          // Find caller socket
          let callerSocketId = null;
          if (to) {
            callerSocketId = await pub.get(socketKey(to));
          }
          if (!callerSocketId && callData.caller) {
            callerSocketId = await pub.get(socketKey(callData.caller));
          }

          if (callerSocketId) {
            io.to(callerSocketId).emit("call-declined", { callId });
          }

          await this.saveCallHistory(callData, "declined");
          console.log(`❌ Call declined: ${callId}`);
        } catch (error) {
          console.error("Error declining call:", error);
          socket.emit("call-error", {
            callId,
            message: "Failed to decline call",
          });
        }
      });

      // End-call event - Enhanced
      socket.on("end-call", async (data) => {
        const { callId, to, toPhone } = data;

        if (!callId) {
          console.error("Invalid end-call data:", data);
          socket.emit("call-error", {
            callId,
            message: "Invalid end-call data",
          });
          return;
        }

        try {
          const callDataStr = await pub.get(`call:${callId}`);
          if (!callDataStr) {
            console.error(`Call not found: ${callId}`);
            return;
          }

          const callData = JSON.parse(callDataStr);
          callData.status = CALL_STATES.ENDED;
          callData.endTime = Date.now();

          // Notify all participants
          const participants = [callData.caller, callData.callee];
          for (const participantId of participants) {
            if (participantId !== userId) {
              // Don't notify the person who ended the call
              const participantSocketId = await pub.get(
                socketKey(participantId)
              );
              if (participantSocketId) {
                io.to(participantSocketId).emit("call-ended", { callId });
                console.log(
                  `🔚 Call ended notification sent to: ${participantId}`
                );
              }
            }
          }

          // Save call history
          const duration = callData.acceptedAt
            ? Math.floor((callData.endTime - callData.acceptedAt) / 1000)
            : 0;
          const status = callData.acceptedAt ? "completed" : "ended";
          await this.saveCallHistory(callData, status);

          await pub.del(`call:${callId}`);
          console.log(`🔚 Call ended: ${callId}`);
        } catch (error) {
          console.error("Error ending call:", error);
          socket.emit("call-error", { callId, message: "Failed to end call" });
        }
      });

      // ICE-candidate event - Enhanced with callId validation
      socket.on("ice-candidate", async (data) => {
        const { to, candidate, callId } = data;

        if (!to || !candidate) {
          console.error("Invalid ICE candidate data:", data);
          return;
        }

        try {
          // Validate that the call exists and user is part of it
          if (callId) {
            const callDataStr = await pub.get(`call:${callId}`);
            if (callDataStr) {
              const callData = JSON.parse(callDataStr);
              if (callData.caller !== userId && callData.callee !== userId) {
                console.error(`User ${userId} not part of call ${callId}`);
                return;
              }
            }
          }

          const toSocketId = await pub.get(socketKey(to));
          if (toSocketId) {
            io.to(toSocketId).emit("ice-candidate", {
              from: userId,
              candidate,
              callId,
            });
            console.log(
              `🧊 ICE candidate sent from ${userId} to ${to} for call ${callId}`
            );
          } else {
            console.log(`Target user ${to} not online for ICE candidate`);
          }
        } catch (error) {
          console.error("Error handling ICE candidate:", error);
        }
      });

      // Call-timeout event - Enhanced
      socket.on("call-timeout", async (data) => {
        const { callId, to } = data;

        if (!callId) {
          console.error("Invalid call-timeout data:", data);
          return;
        }

        try {
          const callDataStr = await pub.get(`call:${callId}`);
          if (!callDataStr) {
            console.error(`Call not found for timeout: ${callId}`);
            return;
          }

          const callData = JSON.parse(callDataStr);
          if (
            callData.status === CALL_STATES.CALLING ||
            callData.status === CALL_STATES.RINGING
          ) {
            callData.status = CALL_STATES.MISSED;
            callData.endTime = Date.now();
            await pub.setex(`call:${callId}`, 60, JSON.stringify(callData));

            await this.saveCallHistory(callData, "missed");

            // Notify the callee about missed call
            if (callData.callee !== userId) {
              const calleeSocketId = await pub.get(socketKey(callData.callee));
              if (calleeSocketId) {
                io.to(calleeSocketId).emit("call-timeout", { callId });
              }
            }

            // Notify the caller about timeout
            if (callData.caller !== userId) {
              const callerSocketId = await pub.get(socketKey(callData.caller));
              if (callerSocketId) {
                io.to(callerSocketId).emit("call-timeout", { callId });
              }
            }

            console.log(`⏰ Call timeout handled: ${callId}`);
          }
        } catch (error) {
          console.error("Error handling call timeout:", error);
        }
      });

      socket.on("one_to_one_message", async (data) => {
        const { to, message } = data;

        if (!to || !message) {
          console.error("Invalid data received:", data);
          return;
        }

        console.log("data : ", data);

        // Update sender's lastSeen
        try {
          await UserModel.findByIdAndUpdate(userId, {
            lastSeen: new Date(),
          });
        } catch (error) {
          console.error("Error updating sender lastSeen:", error);
        }

        const enrichedData: {
          from: string;
          to: string;
          message: any;
          timestamp: string;
          mediaUrl?: string;
          duration?: number;
          type?: string;
        } = {
          from: userId,
          to,
          message,
          timestamp: new Date().toISOString(),
          mediaUrl: data.mediaUrl,
          duration: data.duration,
          type: data.type,
        };

        if (data.mediaUrl) {
          enrichedData.mediaUrl = data.mediaUrl;
          enrichedData.duration = data.duration;
        }

        console.log("Enriched data:", enrichedData);

        await pub.publish("CHITCHAT", JSON.stringify(enrichedData));
      });

      // seen msg logic
      socket.on("seen_message", async (data) => {
        const { from, to } = data;
        if (!from || !to) {
          console.error("Invalid data received for seen message:", data);
          return;
        }
        const message = await MessageModel.find({
          from,
          to,
          seen: false,
        });

        if (message.length > 0) {
          await MessageModel.updateMany(
            { from, to, seen: false },
            { $set: { seen: true, seenAt: new Date() } }
          );

          console.log(`Messages from ${from} to ${to} marked as seen.`);
        } else {
          console.warn(`No unseen messages found from ${from} to ${to}.`);
        }
        const toSocketId = await pub.get(socketKey(to)); // Get socket ID from Redis
        if (toSocketId) {
          this._io.to(toSocketId).emit("seen_message", {
            from,
            to,
            seen: true,
          });
          console.log(`Seen message event sent to ${to} from ${from}.`);
        } else {
          console.warn(`User ${to} is not online to receive seen message.`);
        }
      });

      // Heartbeat to keep user online
      socket.on("heartbeat", async () => {
        try {
          await UserModel.findByIdAndUpdate(userId, {
            lastSeen: new Date(),
          });
        } catch (error) {
          console.error("Error updating user lastSeen on heartbeat:", error);
        }
      });

      socket.on("disconnect", async () => {
        console.log(
          `User disconnected: ${userId} with socket ID: ${socket.id}`
        );

        try {
          // Handle ongoing calls
          const keys = await pub.keys("call:*");
          for (const key of keys) {
            const callDataStr = await pub.get(key);
            if (callDataStr) {
              const callData = JSON.parse(callDataStr);
              if (
                (callData.caller === userId || callData.callee === userId) &&
                (callData.status === CALL_STATES.CALLING ||
                  callData.status === CALL_STATES.RINGING ||
                  callData.status === CALL_STATES.CONNECTED)
              ) {
                callData.status = CALL_STATES.ENDED;
                callData.endTime = Date.now();
                await pub.setex(key, 60, JSON.stringify(callData));

                const otherUserId =
                  callData.caller === userId
                    ? callData.callee
                    : callData.caller;
                const otherSocketId = await pub.get(socketKey(otherUserId));
                if (otherSocketId) {
                  io.to(otherSocketId).emit("call-ended", {
                    callId: callData.callId,
                    reason: "user_disconnected",
                  });
                }

                const status = callData.acceptedAt ? "completed" : "missed";
                await this.saveCallHistory(callData, status);
              }
            }
          }
          // Update user's lastSeen timestamp and set offline when they disconnect
          await UserModel.findByIdAndUpdate(userId, {
            lastSeen: new Date(),
            isOnline: false,
          });

          // Broadcast user offline status to contacts
          await this.broadcastUserStatusChange(userId.toString(), false);
        } catch (error) {
          console.error("Error updating user lastSeen on disconnect:", error);
        }

        pub.del(socketKey(userId)); // Remove socket ID from Redis
      });
    });

    sub.on("message", async (channel, messages) => {
      if (channel === "CHITCHAT") {
        const data = JSON.parse(messages);

        const { from, to, message, timestamp } = data;

        console.log(data);

        let media_path = "";
        let duration = data.duration || 0;

        if (data.mediaUrl && data.mediaUrl.endsWith(".webm")) {
          media_path = data.mediaUrl; // Store the path for audio files
        }
        if (data.type === "video" || data.type === "image") {
          media_path = data.mediaUrl; // Store the path for video files
        }

        if (!from || !to || !message) {
          console.error("Invalid message data:", data);
          return;
        }

        const recipient = await UserModel.findOne({ phoneNumber: to });

        if (!recipient) {
          console.error(`No user found for recipient: ${to}`);
          return;
        }

        const rID = recipient._id;
        let blocked = false;
        if (recipient.blockedContacts?.includes(from)) {
          blocked = true;
        }

        const messageData: any = {
          from,
          to: rID,
          content: message,
          delivered: false,
          seen: false,
          timestamp: new Date(timestamp),
          blocked, // Set blocked status based on recipient's blocked contacts
        };

        if (media_path) {
          messageData.path = media_path; // Save the path for audio files
          messageData.type =
            data.type === "video" || data.type === "image"
              ? data.type
              : "audio";
          if (data.type === "audio") messageData.duration = duration; // Save the duration for audio messages
        }

        const newMsg = await MessageModel.create(messageData);
        console.log(`New message created: ${newMsg} from ${from} to ${to}`);

        if (blocked) {
          await newMsg.save();
          return;
        }

        if (!rID) {
          console.error(`Recipient ID not found for phone number: ${to}`);
          return;
        }
        const toSocketId = await pub.get(socketKey(rID.toString()));

        const sender = await UserModel.findById(from);
        const obj_data = {
          fromId: from,
          senderNumber: sender?.phoneNumber,
          senderName: sender?.displayName,
          toId: rID.toString(),
          recipientNumber: to,
          message: newMsg,
        };

        if (toSocketId) {
          this._io.to(toSocketId).emit("one_to_one_message", obj_data);
          newMsg.delivered = true;
          await newMsg.save();

          console.log(`Message sent from ${from} to ${toSocketId}: ${message}`);
        } else {
          console.warn(`User ${to} is not online.`);
        }
      }
    });

    pub.on("error", (err) => {
      console.error("[Redis pub] Error:", err);
    });
    sub.on("error", (err) => {
      console.error("[Redis sub] Error:", err);
    });
  }

  public get io(): SocketIOServer {
    return this._io;
  }

  private async saveCallHistory(callData: any, status: string): Promise<void> {
    try {
      const duration =
        callData.endTime && callData.acceptedAt
          ? Math.floor((callData.endTime - callData.acceptedAt) / 1000)
          : 0;

      await CallHistoryModel.create({
        callId: callData.callId,
        caller: callData.caller,
        callee: callData.callee,
        callType: callData.callType,
        status,
        duration,
        startTime: new Date(callData.startTime),
        endTime: callData.endTime ? new Date(callData.endTime) : undefined,
      });

      console.log(`📝 Call history saved: ${callData.callId} - ${status}`);
    } catch (error) {
      console.error("Error saving call history:", error);
    }
  }

  // Method to broadcast user status change to their contacts
  private async broadcastUserStatusChange(
    userId: string,
    isOnline: boolean
  ): Promise<void> {
    try {
      // Find the user and their contacts
      const user = await UserModel.findById(userId).populate(
        "contacts.user",
        "_id phoneNumber displayName"
      );
      if (!user) return;

      // Also find users who have this user in their contacts
      const usersWithThisContact = (await UserModel.find({
        "contacts.user": userId,
      })) as Array<{ _id: string }>;

      const allContactsToNotify = [
        ...user.contacts.map((contact) => contact.user.toString()),
        ...usersWithThisContact.map((u) => u._id.toString()),
      ];

      // Remove duplicates
      const uniqueContacts = [...new Set(allContactsToNotify)];

      console.log(
        `📡 Broadcasting status change for user ${userId} (${isOnline ? "online" : "offline"}) to contacts:`,
        uniqueContacts
      );

      // Send status update to each online contact
      for (const contactId of uniqueContacts) {
        const contactSocketId = await pub.get(socketKey(contactId));
        if (contactSocketId) {
          this._io.to(contactSocketId).emit("user_status_change", {
            userId: userId.toString(), // Ensure userId is always a string
            isOnline,
            lastSeen: new Date(),
          });

          console.log(
            `✅ Sent status update to contact ${contactId} via socket ${contactSocketId}`
          );
        } else {
          console.log(`❌ Contact ${contactId} is not online`);
        }
      }
    } catch (error) {
      console.error("Error broadcasting user status change:", error);
    }
  }
}
