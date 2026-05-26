/**
 * Server entry point.
 * Responsible for:
 *  1. Loading environment variables (dotenv.config — called ONCE here)
 *  2. Configuring Express middleware
 *  3. Connecting to external services (MongoDB, AI)
 *  4. Registering API routes
 *  5. Starting the HTTP + Socket.IO server
 */

import dotenv from "dotenv";
dotenv.config(); // Must be first — all other modules read process.env

import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";

import { allowedOrigins } from "./config/cors";
import { Logger } from "./utils/logger";
import { connectMongo } from "./utils/mongoDB";
import { SocketService } from "./services/socket.service";
import { GeminiService } from "./services/gemini.service";
import { AIService } from "./services/ai.service";

import authRouter from "./routes/auth.routes";
import userRouter from "./routes/user.routes";
import chatRouter from "./routes/chat.routes";
import OtpRouter from "./routes/otp.routes";
import uploadRouter from "./routes/upload.routes";
import callRouter from "./routes/call.routes";
import aiRouter from "./routes/ai.routes";

import { PORT } from "./constants/e";

async function init(): Promise<void> {
  const app = express();

  // ── Middleware ─────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Serve uploaded media (audio, video, images) with correct range support
  app.use(
    "/uploads",
    express.static(path.join(__dirname, "../uploads"), {
      setHeaders: (res, filePath) => {
        if (
          filePath.endsWith(".webm") ||
          filePath.endsWith(".mp3") ||
          filePath.endsWith(".wav")
        ) {
          res.setHeader("Accept-Ranges", "bytes");
          res.setHeader("Cache-Control", "public, max-age=0");
        }
      },
    })
  );

  // ── External services ──────────────────────────────────────────────────────
  await connectMongo();

  Logger.info("Initialising AI services…");
  GeminiService.initialize();
  await AIService.createDefaultAIBot();

  // ── Routes ─────────────────────────────────────────────────────────────────
  app.use("/api/auth", authRouter);
  app.use("/api/user", userRouter);
  app.use("/api/chats", chatRouter);
  app.use("/api/otp", OtpRouter);
  app.use("/api/upload", uploadRouter);
  app.use("/api/calls", callRouter);
  app.use("/api/ai", aiRouter);

  // ── HTTP + Socket.IO ───────────────────────────────────────────────────────
  const httpServer = http.createServer(app);
  const socketService = new SocketService(httpServer);

  httpServer.listen(PORT, () => {
    Logger.success(`Server running on http://localhost:${PORT}`);
  });

  socketService.initListeners();
}

init().catch((err) => {
  Logger.error("Failed to initialise the server", err);
  process.exit(1);
});
