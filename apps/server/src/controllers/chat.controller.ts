import { Request, Response } from "express";
import { MessageModel } from "../models/Message";
import { UserModel } from "../models/User";

// GET /api/chats/:userId/messages
export const getChats = async (req: Request, res: Response): Promise<any> => {
  try {
    // Authenticated user (from JWT middleware)
    const currentUserId = req.user?.id; // adapt to your auth middleware
    // The other user's ID or phone number
    const otherUserId =
      req.params.userId || req.query.userId || req.body.userId;

    if (!currentUserId || !otherUserId) {
      return res.status(400).json({ error: "Missing userId(s)" });
    }

    // If otherUserId is a phone number, resolve to userId
    let otherUserObjId = otherUserId;
    if (otherUserId.length < 24) {
      // crude check for ObjectId
      const user = await UserModel.findOne({ phoneNumber: otherUserId });
      if (!user) return res.status(404).json({ error: "User not found" });
      otherUserObjId = user._id;
    }

    // Find all messages between the two users
    const messages = await MessageModel.find({
      $or: [
        { from: currentUserId, to: otherUserObjId },
        { from: otherUserObjId, to: currentUserId },
      ],
    }).sort({ timestamp: 1 });

    return res.json({ messages });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
