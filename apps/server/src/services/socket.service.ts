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

      socket.on("disconnect", () => {
        console.log(
          `User disconnected: ${userId} with socket ID: ${socket.id}`
        );

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
        const newMsg = await MessageModel.create({
          from,
          to: rID,
          content: message,
          delivered: false,
          seen: false,
          timestamp: new Date(timestamp),
        });

        if (!rID) {
          console.error(`Recipient ID not found for phone number: ${to}`);
          return;
        }
        const toSocketId = await pub.get(socketKey(rID.toString()));

        if (toSocketId) {
          this._io.to(toSocketId).emit("one_to_one_message", data);
          newMsg.delivered = true;
          await newMsg.save();
          console.log(`Message sent from ${from} to ${toSocketId}: ${message}`);
        } else {
          console.warn(`User ${to} is not online.`);
        }
      }
    });

    // sub.on("message", async (channel, messages) => {
    //   if (channel === "CHITCHAT") {
    //     const data = JSON.parse(messages);

    //     const { from, to, message, timestamp } = data;
    //     if (!from || !to || !message) {
    //       console.error("Invalid message data:", data);
    //       return;
    //     }

    //     const newMsg = await MessageModel.create({
    //       from,
    //       to,
    //       content: message,
    //       delivered: false,
    //       seen: false,
    //       timestamp: new Date(timestamp),
    //     });

    //     const recipent = await UserModel.findOne({ phoneNumber: to });
    //     console.log(
    //       `Recipient found: ${recipent ? recipent.phoneNumber : "not found"}`
    //     );
    //     if (!recipent) {
    //       console.error(`No messages found for recipient: ${to}`);
    //       return;
    //     }
    //     const rID = recipent._id;
    //     console.log("Messages for recipient:", rID);
    //     if (!rID) {
    //       console.error(`Recipient ID not found for phone number: ${to}`);
    //       return;
    //     }
    //     const toSocketId = await pub.get(socketKey(rID.toString())); // Get socket ID from Redis
    //     if (toSocketId) {
    //       this._io.to(toSocketId).emit("one_to_one_message", data);
    //       newMsg.delivered = true;
    //       await newMsg.save();
    //       console.log(
    //         `Message sent from ${data.from} to ${toSocketId}: ${data.message}`
    //       );
    //     } else {
    //       console.warn(`User ${data.to} is not online.`);
    //       // optional: store offline message
    //     }
    //   }
    // });
  }

  public get io(): SocketIOServer {
    return this._io;
  }
}
