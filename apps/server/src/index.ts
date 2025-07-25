import express from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import { SocketService } from "./services/socket.service";
import authRouter from "./routes/auth.routes";
import { connectMongo } from "./utils/mongoDB";
import cookieparser from "cookie-parser";
import userRouter from "./routes/user.routes";
import chatRouter from "./routes/chat.routes";
import OtpRouter from "./routes/otp.routes";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

async function init() {
  app.use(
    cors({
      origin: [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:4173",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieparser());

  // Initialize routes
  app.use("/api/auth", authRouter);
  app.use("/api/user", userRouter);
  app.use("/api/chats", chatRouter);
  app.use("/api/otp", OtpRouter);

  const httpServer = http.createServer(app);

  // socket.io setup
  const socketIOservice = new SocketService(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
  connectMongo();
  socketIOservice.initListeners();
}

init().catch((err) => {
  console.error("Failed to initialize the server:", err);
  process.exit(1);
});
