export interface AIBot {
  botId: string;
  name: string;
  avatarUrl?: string;
  status: string;
  provider: "gemini";
  isActive: boolean;
  systemPrompt?: string;
}
