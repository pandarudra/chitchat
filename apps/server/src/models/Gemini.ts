import mongoose, { Document, Schema } from "mongoose";

export interface IAIBot extends Document {
  botId: string;
  name: string;
  avatarUrl?: string;
  status: string;
  provider: "gemini";
  isActive: boolean;
  systemPrompt?: string;
}

const aiBotSchema = new Schema<IAIBot>(
  {
    botId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    avatarUrl: { type: String },
    status: { type: String, default: "AI Assistant - Always available" },
    provider: {
      type: String,
      enum: ["gemini"],
      required: true,
    },
    isActive: { type: Boolean, default: true },
    systemPrompt: { type: String },
  },
  { timestamps: true }
);

export const Gemini = mongoose.model<IAIBot>("Gemini", aiBotSchema);
