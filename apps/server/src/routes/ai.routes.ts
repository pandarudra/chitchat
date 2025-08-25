import { Router } from "express";
import { getAIResponse, getAIBots } from "../controllers/ai.controller";
import { authenticate } from "../middleware/auth.middleware";

const aiRouter = Router();

aiRouter.use(authenticate);

// Chat with AI
aiRouter.post("/chat", getAIResponse);

// Get available AI bots
aiRouter.get("/bots", getAIBots);

export default aiRouter;
