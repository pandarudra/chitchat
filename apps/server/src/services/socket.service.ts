import { Server as SocketIOServer } from "socket.io";
import { Server as httpServer } from "http";
import Redis from "ioredis";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();

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

const userSocketMap = new Map<string, string>(); // userId -> socketId

export class SocketService {
  private _io: SocketIOServer;

  constructor(server: httpServer) {
    this._io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        allowedHeaders: ["*"],
      },
    });

    // ✅ JWT Authentication Middleware
    this._io.use((socket, next) => {
      const token = socket.handshake.auth?.token;
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

    io.on("connection", (socket) => {
      const userId = socket.data.userId;
      userSocketMap.set(userId, socket.id);
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

      socket.on("disconnect", () => {
        for (const [uid, sid] of userSocketMap.entries()) {
          if (sid === socket.id) {
            userSocketMap.delete(uid);
            console.log(`User ${uid} disconnected and removed from map.`);
            break;
          }
        }
      });
    });

    sub.on("message", (channel, message) => {
      if (channel === "CHITCHAT") {
        const data = JSON.parse(message);
        const toSocketId = userSocketMap.get(data.to);
        if (toSocketId) {
          this._io.to(toSocketId).emit("one_to_one_message", data);
          console.log(
            `Message sent from ${data.from} to ${data.to}: ${data.message}`
          );
        } else {
          console.warn(`User ${data.to} is not online.`);
          // optional: store offline message
        }
      }
    });
  }

  public get io(): SocketIOServer {
    return this._io;
  }
}
