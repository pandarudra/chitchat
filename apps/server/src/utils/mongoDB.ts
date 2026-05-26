import mongoose from "mongoose";
import { Logger } from "./logger";
import { MONGO_URI } from "../constants/e";

/**
 * Opens a connection to MongoDB using the MONGO_URI environment variable.
 * Throws if the URI is missing or the connection fails.
 */
export const connectMongo = async (): Promise<void> => {
  await mongoose.connect(MONGO_URI);
  Logger.success("MongoDB connected successfully.");
};
