import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMessage extends Document {
  from: Types.ObjectId;
  to: Types.ObjectId;
  content: string;
  delivered: boolean;
  seen: boolean;
  seenAt?: Date; // Optional timestamp
  timestamp: Date;
  blocked?: boolean; // Indicates if the message is blocked
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
  },
  { timestamps: true }
);

export const MessageModel = mongoose.model<IMessage>("Message", messageSchema);
