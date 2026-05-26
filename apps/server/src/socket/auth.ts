import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";
import { JWT_SECRET } from "../constants/e";

/**
 * Socket.IO middleware that authenticates the connection using the `token`
 * cookie set by the REST auth flow.
 * Attaches `socket.data.userId` on success, or calls next(error) on failure.
 */
export function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void
): void {
  const rawCookies = socket.handshake.headers.cookie;

  if (!rawCookies) {
    next(new Error("Authentication failed: no cookies provided."));
    return;
  }

  const { token } = cookie.parse(rawCookies);

  if (!token) {
    next(new Error("Authentication failed: token cookie is missing."));
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    socket.data.userId = payload.userId;
    next();
  } catch {
    next(new Error("Authentication failed: invalid or expired token."));
  }
}
