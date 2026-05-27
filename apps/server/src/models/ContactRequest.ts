import mongoose, { Document, Schema } from "mongoose";

export interface IContactRequest extends Document {
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "rejected";
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const contactRequestSchema = new Schema<IContactRequest>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    respondedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

contactRequestSchema.index({ sender: 1, receiver: 1, status: 1 });
contactRequestSchema.index({ receiver: 1, status: 1, createdAt: -1 });

export const ContactRequestModel = mongoose.model<IContactRequest>(
  "ContactRequest",
  contactRequestSchema,
);
