import express from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import { SocketService } from "./sockets/chatSockets";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

async function init() {
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
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
