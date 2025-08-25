import { Request, Response } from "express";
import { GeminiService } from "../services/gemini.service";
import { AIService } from "../services/ai.service";
import { MessageModel } from "../models/Message";

export const getAIResponse = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { message } = req.body;
    const userId = req.user?._id;

    if (!message || !userId) {
      return res.status(400).json({
        error: "Message and user authentication are required",
      });
    }

    // Get the AI bot user
    const aiBotUser = await AIService.getDefaultAIBot();
    if (!aiBotUser) {
      return res.status(404).json({
        error: "Susi is currently unavailable",
      });
    }

    const botId = aiBotUser._id as any; // Cast to handle MongoDB ObjectId

    // Get AI bot metadata for system prompt
    const aiBotMetadata = await AIService.getAIBotMetadata(botId.toString());
    if (!aiBotMetadata || !aiBotMetadata.isActive) {
      return res.status(404).json({
        error: "Susi is currently unavailable",
      });
    }

    // Get previous messages for context (last 10 messages)
    const previousMessages = await MessageModel.find({
      $or: [
        { from: userId, to: botId },
        { from: botId, to: userId },
      ],
    })
      .sort({ timestamp: -1 })
      .limit(10)
      .select("content from timestamp");

    // Generate AI response
    const aiResponse = await GeminiService.generateContextualResponse(
      message,
      botId.toString(),
      userId.toString(),
      previousMessages.reverse().map((msg) => ({
        content: msg.content,
        senderId: msg.from.toString(), // Convert ObjectId to string
        timestamp: msg.timestamp,
      }))
    );

    // Save user message
    const userMessage = new MessageModel({
      from: userId,
      to: botId,
      content: message,
      type: "text",
      timestamp: new Date(),
      delivered: true,
      read: true,
      isAIMessage: false,
    });
    await userMessage.save();

    // Save AI response
    const aiMessage = new MessageModel({
      from: botId,
      to: userId,
      content: aiResponse,
      type: "text",
      timestamp: new Date(),
      delivered: true,
      read: false,
      isAIMessage: true,
      conversationContext: `AI response to: ${message}`,
    });
    await aiMessage.save();

    return res.status(200).json({
      success: true,
      message: "AI response generated successfully",
      data: {
        userMessage: {
          id: userMessage._id,
          content: userMessage.content,
          timestamp: userMessage.timestamp,
          from: userMessage.from,
        },
        aiResponse: {
          id: aiMessage._id,
          content: aiMessage.content,
          timestamp: aiMessage.timestamp,
          from: aiMessage.from,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error in AI chat:", error);
    return res.status(500).json({
      error: "Internal server error while processing AI request",
    });
  }
};

export const getAIBots = async (req: Request, res: Response): Promise<any> => {
  try {
    const bots = await AIService.getActiveAIBots();

    return res.status(200).json({
      success: true,
      data: bots,
    });
  } catch (error) {
    console.error("❌ Error getting AI bots:", error);
    return res.status(500).json({
      error: "Internal server error while fetching AI bots",
    });
  }
};
