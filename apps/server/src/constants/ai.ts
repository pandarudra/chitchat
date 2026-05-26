/**
 * Shared constants for the Susi AI bot.
 * Centralising these eliminates the phonenumber / name mismatch bug that
 * previously caused getDefaultAIBot() to always re-create the bot.
 */

/** The unique "email" used to identify the AI bot in the User collection. */
export const AI_BOT_EMAIL = "AI_ASSISTANT_SUSI";

export const AI_BOT_NAME = "Susi";

export const AI_BOT_AVATAR =
  "https://res.cloudinary.com/chitchat99/image/upload/v1755927525/ai_whkw7p.png";

export const AI_BOT_STATUS = "Your friendly AI companion 🤖✨";

export const AI_SYSTEM_PROMPT = `You are Susi, a friendly AI assistant integrated into \
ChitChat messaging app. Be cheerful, helpful, and conversational. Keep responses concise \
but informative. Use a warm and approachable tone.`;

/** Models tried in order — first one that responds is used. */
export const GEMINI_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-pro",
  "gemini-1.0-pro",
] as const;
