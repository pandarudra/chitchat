import { GoogleGenerativeAI } from "@google/generative-ai";
import { Logger } from "../utils/logger";
import { AI_SYSTEM_PROMPT, GEMINI_MODELS } from "../constants/ai";
import { GEMINI_API_KEY } from "../constants/e";

export class GeminiService {
  private static genAI: GoogleGenerativeAI;

  /** Must be called once at startup (after dotenv.config()). */
  static initialize(): void {
    if (!GEMINI_API_KEY) {
      Logger.warn("GEMINI_API_KEY not set — AI responses will be unavailable.");
      return;
    }
    this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    Logger.success("Gemini AI service initialised.");
  }

  /**
   * Generates a text response from Gemini.
   * Tries each model in GEMINI_MODELS order and uses the first that succeeds.
   * Returns a graceful error string (never throws) so chat delivery is unaffected.
   */
  static async generateResponse(
    message: string,
    systemPrompt?: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<string> {
    if (!this.genAI) {
      this.initialize();
      if (!this.genAI) {
        return "I'm sorry, but I'm currently unable to respond. Please try again later.";
      }
    }

    // Try each model until one works
    let workingModel = null;
    for (const modelName of GEMINI_MODELS) {
      try {
        workingModel = this.genAI.getGenerativeModel({ model: modelName });
        Logger.debug(`Using Gemini model: ${modelName}`);
        break;
      } catch {
        Logger.warn(`Model "${modelName}" unavailable, trying next…`);
      }
    }

    if (!workingModel) {
      Logger.error("All Gemini models failed.");
      return "I'm currently unable to access my AI models. Please try again later.";
    }

    try {
      // Build the full prompt with optional system instructions and history
      const basePrompt =
        systemPrompt ?? "You are Susi, a friendly AI assistant. Be cheerful and conversational.";

      let prompt = basePrompt;

      if (conversationHistory && conversationHistory.length > 0) {
        prompt += "\n\nConversation history:\n";
        for (const msg of conversationHistory) {
          prompt += `${msg.role}: ${msg.content}\n`;
        }
      }

      prompt += `\nUser: ${message}\nAssistant:`;

      const result = await workingModel.generateContent(prompt);
      return (
        result.response.text() ||
        "I apologise, but I couldn't generate a response. Please try again."
      );
    } catch (error: any) {
      Logger.error("Error generating Gemini response", error);
      return "I'm experiencing some technical difficulties right now. Please try again in a moment.";
    }
  }

  /**
   * Generates a contextual response using the last 10 messages as history.
   * This is the primary method called from the AI controller.
   */
  static async generateContextualResponse(
    message: string,
    _botId: string,
    userId: string,
    previousMessages?: Array<{ content: string; senderId: string; timestamp: Date }>
  ): Promise<string> {
    try {
      const conversationHistory =
        previousMessages?.slice(-10).map((msg) => ({
          role: msg.senderId === userId ? "user" : "assistant",
          content: msg.content,
        })) ?? [];

      return await this.generateResponse(message, AI_SYSTEM_PROMPT, conversationHistory);
    } catch (error) {
      Logger.error("Error generating contextual Gemini response", error);
      return "I'm having trouble right now. Please try again in a moment.";
    }
  }
}
