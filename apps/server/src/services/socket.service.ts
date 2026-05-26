import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import { allowedOrigins } from "../config/cors";
import { Logger } from "../utils/logger";
import { socketAuthMiddleware } from "../socket/auth";
import { registerCallHandlers, handleDisconnectedCalls } from "../socket/handlers/call.handler";
import { registerMessageHandlers, startMessageConsumer } from "../socket/handlers/message.handler";
import { registerPresenceHandlers, handleUserConnected } from "../socket/handlers/presence.handler";

/**
 * Thin orchestrator that wires together the Socket.IO server with the
 * domain-specific handlers (calls, messages, presence).
 *
 * The actual event logic lives in:
 *   - socket/handlers/call.handler.ts
 *   - socket/handlers/message.handler.ts
 *   - socket/handlers/presence.handler.ts
 *   - socket/auth.ts
 */
export class SocketService {
  private _io: SocketIOServer;

  constructor(httpServer: HttpServer) {
    this._io = new SocketIOServer(httpServer, {
      cors: {
        origin: allowedOrigins,
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    // Authenticate every connection before it can emit/receive events
    this._io.use(socketAuthMiddleware);
  }

  public initListeners(): void {
    const io = this._io;

    // Start the Redis pub/sub consumer that delivers messages to recipients
    startMessageConsumer(io);

    io.on("connection", async (socket) => {
      const userId = socket.data.userId as string | undefined;

      if (!userId) {
        Logger.warn("Socket connected without a userId — disconnecting.");
        socket.disconnect(true);
        return;
      }

      // Mark user online, store socket mapping in Redis, notify contacts
      await handleUserConnected(io, socket, userId);

      // Register domain-specific event handlers
      registerCallHandlers(io, socket, userId);
      registerMessageHandlers(io, socket, userId);

      // Presence handlers include disconnect — must be registered last
      // so disconnected-call cleanup can run after call handlers are set up
      registerPresenceHandlers(io, socket, userId);

      // Handle calls that were active if this user was previously in one
      socket.on("disconnect", async () => {
        await handleDisconnectedCalls(io, userId);
      });
    });

    Logger.success("Socket.IO listeners initialised.");
  }

  public get io(): SocketIOServer {
    return this._io;
  }
}
