import express from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import path from "path";
import { SocketService } from "./services/socket.service";
import authRouter from "./routes/auth.routes";
import { connectMongo } from "./utils/mongoDB";
import cookieparser from "cookie-parser";
import userRouter from "./routes/user.routes";
import chatRouter from "./routes/chat.routes";
import OtpRouter from "./routes/otp.routes";
import uploadRouter from "./routes/upload.routes";
import callRouter from "./routes/call.routes";
import aiRouter from "./routes/ai.routes";
import { AIService } from "./services/ai.service";
import { GeminiService } from "./services/gemini.service";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

async function init() {
  app.use(
    cors({
      origin: [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "https://chitchat-web-chi.vercel.app",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieparser());

  // Serve static files from uploads directory
  app.use(
    "/uploads",
    express.static(path.join(__dirname, "../uploads"), {
      setHeaders: (res, path) => {
        if (
          path.endsWith(".webm") ||
          path.endsWith(".mp3") ||
          path.endsWith(".wav")
        ) {
          res.setHeader("Accept-Ranges", "bytes");
          res.setHeader("Cache-Control", "public, max-age=0");
        }
      },
    })
  );

  // Initialize database connection
  await connectMongo();

  // Initialize AI services
  console.log("🤖 Initializing AI services...");
  GeminiService.initialize();
  await AIService.createDefaultAIBot();

  // Initialize routes
  app.use("/api/auth", authRouter);
  app.use("/api/user", userRouter);
  app.use("/api/chats", chatRouter);
  app.use("/api/otp", OtpRouter);
  app.use("/api/upload", uploadRouter);
  app.use("/api/calls", callRouter);
  app.use("/api/ai", aiRouter);

  const httpServer = http.createServer(app);

  // socket.io setup
  const socketIOservice = new SocketService(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

  socketIOservice.initListeners();
}

init().catch((err) => {
  console.error("Failed to initialize the server:", err);
  process.exit(1);
});
