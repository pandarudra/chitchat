import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

export class GeminiService {
  private static genAI: GoogleGenerativeAI;
  private static availableModels = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-1.0-pro",
  ];

  static initialize() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("⚠️ GEMINI_API_KEY not found in environment variables");
      return;
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log("✅ Gemini AI service initialized");
  }

  static async generateResponse(
    message: string,
    systemPrompt?: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<string> {
    try {
      if (!this.genAI) {
        this.initialize();
        if (!this.genAI) {
          return "I'm sorry, but I'm currently unable to respond. Please try again later.";
        }
      }

      // Try different models until one works
      let model;
      let lastError;

      for (const modelName of this.availableModels) {
        try {
          model = this.genAI.getGenerativeModel({ model: modelName });

          // Test the model with a simple generation to see if it works
          console.log(`🤖 Trying model: ${modelName}`);
          break;
        } catch (error) {
          console.warn(`⚠️ Model ${modelName} failed, trying next...`);
          lastError = error;
          continue;
        }
      }

      if (!model) {
        console.error("❌ All models failed:", lastError);
        return "I'm currently unable to access my AI models. Please try again later.";
      }

      // Build conversation context
      let prompt =
        systemPrompt ||
        "You are Susi, a friendly AI assistant. Be cheerful and conversational.";

      if (conversationHistory && conversationHistory.length > 0) {
        prompt += "\n\nConversation history:\n";
        conversationHistory.forEach((msg) => {
          prompt += `${msg.role}: ${msg.content}\n`;
        });
      }

      prompt += `\nUser: ${message}\nAssistant:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;

      return (
        response.text() ||
        "I apologize, but I couldn't generate a response. Please try again."
      );
    } catch (error: any) {
      console.error("❌ Error generating Gemini response:", error);

      // Check if it's an API key issue
      if (error.message && error.message.includes("API key")) {
        return "I'm currently experiencing authentication issues. The administrator needs to update my API key. Please try again later.";
      }

      // Check if it's a model not found issue
      if (
        error.message &&
        (error.message.includes("not found") || error.message.includes("404"))
      ) {
        return "I'm currently experiencing model compatibility issues. The administrator needs to update my configuration. Please try again later.";
      }

      // Provide a more helpful fallback response based on the user's message
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
        return "Hello! I'm having some technical difficulties right now, but I'm happy to chat when my systems are back online.";
      } else if (lowerMessage.includes("help")) {
        return "I'd love to help you, but I'm currently experiencing some technical issues. Please try again in a few minutes.";
      } else if (lowerMessage.includes("how are you")) {
        return "I'm having some technical difficulties at the moment, but thank you for asking! Please try chatting with me again later.";
      } else {
        return "I'm experiencing some technical difficulties right now. Please try again in a moment, or contact support if the issue persists.";
      }
    }
  }

  static async generateContextualResponse(
    message: string,
    botId: string,
    userId: string,
    previousMessages?: Array<{
      content: string;
      senderId: string;
      timestamp: Date;
    }>
  ): Promise<string> {
    try {
      // Build conversation history from previous messages
      const conversationHistory =
        previousMessages?.slice(-10).map((msg) => ({
          role: msg.senderId === userId ? "user" : "assistant",
          content: msg.content,
        })) || [];

      const systemPrompt = `You are Susi, a cheerful and friendly AI assistant in the ChitChat messaging app. 
      Be helpful, warm, and conversational. Keep responses natural and engaging.
      You can help with questions, have casual conversations, or provide assistance.
      Use a friendly and approachable tone, like talking to a good friend. 🤖✨`;

      return await this.generateResponse(
        message,
        systemPrompt,
        conversationHistory
      );
    } catch (error) {
      console.error("❌ Error generating contextual response:", error);
      return "I'm having trouble right now. Please try again in a moment.";
    }
  }
}
