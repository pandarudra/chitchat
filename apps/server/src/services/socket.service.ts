import { Server as SocketIOServer } from "socket.io";
import { Server as httpServer } from "http";
import Redis from "ioredis";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";

import { MessageModel } from "../models/Message";
import { UserModel } from "../models/User";
dotenv.config();

// pub/sub Redis clients
const pub = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
    ? parseInt(process.env.REDIS_PORT, 10)
    : undefined,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
});
const sub = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
    ? parseInt(process.env.REDIS_PORT, 10)
    : undefined,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
});

// redis map userid -> socketId key
const socketKey = (userId: string): string => {
  return `socket:${userId}`;
};

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

    // ✅ JWT Authentication Middleware
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

  public initListeners(): void {
    const io = this._io;

    io.on("connection", async (socket) => {
      const userId = socket.data.userId;
      console.log(`New connection: ${userId} with socket ID: ${socket.id}`);
      if (!userId) {
        console.error("User ID not found in socket data.");
        return;
      }

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

      socket.on("one_to_one_message", async (data) => {
        const { to, message } = data;

        if (!to || !message) {
          console.error("Invalid data received:", data);
          return;
        }

        console.log(data);

        // Update sender's lastSeen
        try {
          await UserModel.findByIdAndUpdate(userId, {
            lastSeen: new Date(),
          });
        } catch (error) {
          console.error("Error updating sender lastSeen:", error);
        }

        const enrichedData = {
          from: userId,
          to,
          message,
          timestamp: new Date().toISOString(),
        };

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

        // Update user's lastSeen timestamp and set offline when they disconnect
        try {
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
        const newMsg = await MessageModel.create({
          from,
          to: rID,
          content: message,
          delivered: false,
          seen: false,
          timestamp: new Date(timestamp),
          blocked, // Set blocked status based on recipient's blocked contacts
        });

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
