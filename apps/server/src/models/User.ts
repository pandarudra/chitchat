import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  phoneNumber: string;
  displayName: string;
  avatarUrl?: string;
  status?: string;
  lastSeen?: Date;
  isOnline: boolean;
  contacts: {
    user: mongoose.Types.ObjectId;
    name: string;
    phonenumber: string;
  }[];
}

const userSchema = new Schema<IUser>(
  {
    phoneNumber: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    avatarUrl: { type: String },
    status: { type: String, default: "Hey there! I am using ChitChat." },
    lastSeen: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false },
    contacts: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        phonenumber: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>("User", userSchema);
