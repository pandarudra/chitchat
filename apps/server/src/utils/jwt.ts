import jwt from "jsonwebtoken";
import { JWT_SECRET, REFRESH_SECRET } from "../constants/e";

/** Discriminates between the two token types used by the app. */
export type TokenType = "access" | "refresh";

function getSecret(type: TokenType): string {
  const secret = type === "access" ? JWT_SECRET : REFRESH_SECRET;
  if (!secret) {
    throw new Error(`Secret for token type "${type}" is not configured.`);
  }
  return secret;
}

/** Signs and returns a JWT for the given user ID and token type. */
export const generateToken = (userId: string, type: TokenType): string => {
  const secret = getSecret(type);
  const expiresIn = type === "access" ? "1d" : "7d";
  return jwt.sign({ userId }, secret, { expiresIn });
};

/**
 * Verifies a JWT and returns the embedded userId.
 * Throws if the token is invalid or expired.
 */
export const verifyJWT = (token: string, type: TokenType): string => {
  const secret = getSecret(type);
  const decoded = jwt.verify(token, secret) as { userId: string };
  return decoded.userId;
};
