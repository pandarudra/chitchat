import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMessage extends Document {
  from: Types.ObjectId;
  to: Types.ObjectId;
  content: string;
  delivered: boolean;
  seen: boolean;
  seenAt?: Date;
  timestamp: Date;
  blocked?: boolean;
  path?: string;
  type: "text" | "audio" | "image" | "video" | "file" | "ai_response";
  duration?: number;
  isAIMessage?: boolean; // New field to identify AI messages
  conversationContext?: string; // For maintaining AI conversation context
  fileName?: string; // File name for media messages
  fileSize?: number; // File size for media messages
  mediaUrl?: string; // URL for media files (images, videos, audio)
}

const messageSchema = new Schema<IMessage>(
  {
    from: { type: Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    delivered: { type: Boolean, default: false },
    seen: { type: Boolean, default: false },
    seenAt: { type: Date },
    timestamp: { type: Date, default: Date.now },
    blocked: { type: Boolean, default: false }, // Indicates if the message is blocked
    path: { type: String }, // Optional path for audio files (deprecated - use mediaUrl)
    type: {
      type: String,
      enum: ["text", "audio", "image", "video", "file", "ai_response"],
      default: "text",
    }, // Type of message
    duration: { type: Number, default: 0 }, // Duration in seconds for audio messages
    isAIMessage: { type: Boolean, default: false }, // Flag to identify AI-generated messages
    conversationContext: { type: String }, // Context for AI conversations
    fileName: { type: String }, // File name for media messages
    fileSize: { type: Number }, // File size for media messages
    mediaUrl: { type: String }, // URL for media files (images, videos, audio)
  },
  { timestamps: true }
);

export const MessageModel = mongoose.model<IMessage>("Message", messageSchema);
