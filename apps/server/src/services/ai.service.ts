import { AIModel } from "../models/Ai";
import { UserModel } from "../models/User";
import { Logger } from "../utils/logger";
import {
  AI_BOT_EMAIL,
  AI_BOT_NAME,
  AI_BOT_AVATAR,
  AI_BOT_STATUS,
  AI_SYSTEM_PROMPT,
} from "../constants/ai";

export class AIService {
  /**
   * Ensures the Susi AI bot exists as a User document.
   * Called once at startup — idempotent; returns the existing document if found.
   */
  static async createDefaultAIBot() {
    const existingUser = await UserModel.findOne({ email: AI_BOT_EMAIL });
    if (existingUser) {
      return existingUser;
    }

    try {
      const aiUser = new UserModel({
        email: AI_BOT_EMAIL,
        displayName: AI_BOT_NAME,
        avatarUrl: AI_BOT_AVATAR,
        status: AI_BOT_STATUS,
        isOnline: true,
        lastSeen: new Date(),
      });
      await aiUser.save();

      // Also persist metadata in the AI collection
      const aiBot = new AIModel({
        botId: (aiUser._id as any).toString(),
        name: AI_BOT_NAME,
        avatarUrl: AI_BOT_AVATAR,
        status: AI_BOT_STATUS,
        provider: "gemini",
        isActive: true,
        systemPrompt: AI_SYSTEM_PROMPT,
      });
      await aiBot.save();

      Logger.success("Default AI bot (Susi) created.");
      return aiUser;
    } catch (error) {
      Logger.error("Error creating default AI bot", error);
      throw error;
    }
  }

  /**
   * Returns the Susi AI bot User document, creating it if it doesn't exist yet.
   * This is the primary accessor used by other parts of the codebase.
   */
  static async getDefaultAIBot() {
    try {
      // Bug fix: was querying "AI_ASSISTANT" but bot is stored as AI_BOT_EMAIL ("AI_ASSISTANT_SUSI")
      const botUser = await UserModel.findOne({ email: AI_BOT_EMAIL });
      if (botUser) {
        return botUser;
      }
      return this.createDefaultAIBot();
    } catch (error) {
      Logger.error("Error getting default AI bot", error);
      throw error;
    }
  }

  /** Returns the AI metadata document for a given bot User ID. */
  static async getAIBotMetadata(botUserId: string) {
    try {
      return await AIModel.findOne({ botId: botUserId });
    } catch (error) {
      Logger.error("Error getting AI bot metadata", error);
      return null;
    }
  }

  /** Returns all active AI bots from the AI collection. */
  static async getActiveAIBots() {
    try {
      return await AIModel.find({ isActive: true });
    } catch (error) {
      Logger.error("Error getting active AI bots", error);
      throw error;
    }
  }
}
