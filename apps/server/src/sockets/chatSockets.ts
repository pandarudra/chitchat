import { Server as SocketIOServer } from "socket.io";
import { Server as httpServer } from "http";
import Redis from "ioredis";
import dotenv from "dotenv";
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

const userSocketMap = new Map<string, string>();

export class SocketService {
  private _io: SocketIOServer;

  constructor(server: httpServer) {
    this._io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        allowedHeaders: ["*"],
      },
    });
    sub.subscribe("CHITCHAT");
  }

  public initListeners(): void {
    const io = this._io;
    io.on("connection", (socket) => {
      socket.emit("connected", { socketId: socket.id });

      console.log(`Client connected: ${socket.id}`);

      socket.on("register_user", (userName) => {
        userSocketMap.set(userName, socket.id);
        console.log(
          `User registered: ${userName} with socket ID: ${socket.id}`
        );
      });

      socket.on("one_to_one_message", async (data) => {
        const { to, message, name } = data;

        if (!to || !message || !name) {
          console.error("Invalid data received:", data);
          return;
        }

        const toSocketId = userSocketMap.get(to);
        if (!toSocketId) {
          console.error(`User ${to} is not connected.`);
          return;
        }

        await pub.publish("CHITCHAT", JSON.stringify(data));
      });

      socket.on("disconnect", () => {
        for (const [userName, socketId] of userSocketMap.entries()) {
          if (socketId === socket.id) {
            userSocketMap.delete(userName);
            console.log(`User ${userName} disconnected and removed from map.`);
            break;
          }
        }
        console.log(`Client disconnected: ${socket.id}`);
      });
    });

    sub.on("message", (channel, message) => {
      if (channel === "CHITCHAT") {
        const data = JSON.parse(message);
        const toSocketId = userSocketMap.get(data.to);
        if (toSocketId) {
          io.to(toSocketId).emit("one_to_one_message", data);
          console.log(
            `Message sent to ${data.to} from ${data.name}: ${data.message}`
          );
        } else {
          console.error(`User ${data.to} is not connected.`);
        }
      }
    });
  }

  public get io(): SocketIOServer {
    return this._io;
  }
}
