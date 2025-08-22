import { AIModel } from "../models/Ai";
import { UserModel } from "../models/User";
import mongoose from "mongoose";

export class AIService {
  // Create default AI bot as a User entry
  static async createDefaultAIBot() {
    try {
      // Check if AI bot already exists as a user
      const existingUser = await UserModel.findOne({
        phoneNumber: "AI_ASSISTANT",
      });

      if (!existingUser) {
        // Create AI bot as a User
        const aiUser = new UserModel({
          phoneNumber: "AI_ASSISTANT",
          displayName: "Susi",
          avatarUrl:
            "https://api.dicebear.com/9.x/bottts/svg?seed=susi&backgroundColor=ffdfbf&primaryColor=ff6b6b",
          status: "Your friendly AI companion 🤖✨",
          isOnline: true, // AI is always online
          lastSeen: new Date(),
        });

        await aiUser.save();

        // Also create entry in AI collection for metadata
        const aiBot = new AIModel({
          botId: (aiUser._id as any).toString(),
          name: "Susi",
          avatarUrl:
            "https://api.dicebear.com/9.x/bottts/svg?seed=susi&backgroundColor=ffdfbf&primaryColor=ff6b6b",
          status: "Your friendly AI companion 🤖✨",
          provider: "gemini",
          isActive: true,
          systemPrompt:
            "You are Susi, a friendly AI assistant integrated into ChitChat messaging app. Be cheerful, helpful, and conversational. Keep responses concise but informative. Use a warm and approachable tone.",
        });

        await aiBot.save();
        console.log("✅ Default AI bot created successfully");
        return aiUser;
      }

      return existingUser;
    } catch (error) {
      console.error("❌ Error creating default AI bot:", error);
      throw error;
    }
  }

  // Get default AI bot User
  static async getDefaultAIBot() {
    try {
      let botUser = await UserModel.findOne({ phoneNumber: "AI_ASSISTANT" });

      if (!botUser) {
        botUser = await this.createDefaultAIBot();
      } else {
        // Update existing bot to Susi if needed
        if (botUser.displayName !== "Susi") {
          await this.updateAIBotToSusi(botUser);
        }
      }

      return botUser;
    } catch (error) {
      console.error("❌ Error getting default AI bot:", error);
      throw error;
    }
  }

  // Update existing AI bot to Susi
  static async updateAIBotToSusi(existingBot: any) {
    try {
      // Update User model
      await UserModel.findByIdAndUpdate(existingBot._id, {
        displayName: "Susi",
        avatarUrl:
          "https://api.dicebear.com/9.x/bottts/svg?seed=susi&backgroundColor=ffdfbf&primaryColor=ff6b6b",
        status: "Your friendly AI companion 🤖✨",
      });

      // Update AI model
      await AIModel.findOneAndUpdate(
        { botId: existingBot._id.toString() },
        {
          name: "Susi",
          avatarUrl:
            "https://api.dicebear.com/9.x/bottts/svg?seed=susi&backgroundColor=ffdfbf&primaryColor=ff6b6b",
          status: "Your friendly AI companion 🤖✨",
          systemPrompt:
            "You are Susi, a friendly AI assistant integrated into ChitChat messaging app. Be cheerful, helpful, and conversational. Keep responses concise but informative. Use a warm and approachable tone.",
        }
      );

      console.log("✅ AI bot updated to Susi successfully");
    } catch (error) {
      console.error("❌ Error updating AI bot to Susi:", error);
    }
  }

  // Get AI bot metadata
  static async getAIBotMetadata(botUserId: string) {
    try {
      return await AIModel.findOne({ botId: botUserId });
    } catch (error) {
      console.error("❌ Error getting AI bot metadata:", error);
      return null;
    }
  }

  // Get all active AI bots
  static async getActiveAIBots() {
    try {
      return await AIModel.find({ isActive: true });
    } catch (error) {
      console.error("❌ Error getting active AI bots:", error);
      throw error;
    }
  }
}
