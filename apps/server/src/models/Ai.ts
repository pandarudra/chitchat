import mongoose, { Schema, Document } from "mongoose";

export interface IAI extends Document {
  botId: string;
  name: string;
  avatarUrl?: string;
  status: string;
  provider: "gemini";
  isActive: boolean;
  systemPrompt?: string;
}

const AISchema = new Schema<IAI>(
  {
    botId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    avatarUrl: { type: String },
    status: { type: String, default: "available" },
    provider: { type: String, enum: ["gemini"], required: true },
    isActive: { type: Boolean, default: true },
    systemPrompt: { type: String },
  },
  { timestamps: true }
);

export const AIModel = mongoose.model<IAI>("AI", AISchema);
