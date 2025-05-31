import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  phoneNumber: string;
  displayName: string;
  avatarUrl?: string;
  status?: string;
  lastSeen?: Date;
}

const userSchema = new Schema<IUser>(
  {
    phoneNumber: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    avatarUrl: { type: String },
    status: { type: String },
    lastSeen: { type: Date },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>("User", userSchema);
