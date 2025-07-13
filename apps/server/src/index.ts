import express from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import { SocketService } from "./services/socket.service";
import authRouter from "./routes/auth.routes";
import { connectMongo } from "./utils/mongoDB";
import cookieparser from "cookie-parser";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

async function init() {
  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true, // Allow cookies to be sent
      // Adjust this to your frontend URL
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieparser());

  // Initialize routes
  app.use("/api/auth", authRouter);
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
