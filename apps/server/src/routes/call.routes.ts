import express from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getCallHistory,
  deleteCallHistory,
  clearCallHistory,
} from "../controllers/call.controller";

const router = express.Router();

// Get call history
router.get("/history", authenticate, getCallHistory);

// Delete specific call history entry
router.delete("/history/:callId", authenticate, deleteCallHistory);

// Clear all call history
router.delete("/history", authenticate, clearCallHistory);

export default router;
