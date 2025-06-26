import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;
const REFRESH_SECRET = process.env.REFRESH_SECRET as string;

export const generateToken = (userId: string, type: string): string => {
  if (type !== "access" && type !== "refresh") {
    throw new Error("Invalid token type. Use 'access' or 'refresh'.");
  }
  const secret = type === "access" ? JWT_SECRET : REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }
  return jwt.sign({ userId }, secret, {
    expiresIn: type === "access" ? "1d" : "7d",
  });
};

export const verifyJWT = (
  token: string,
  type: string
): string | jwt.JwtPayload => {
  const secret = type === "access" ? JWT_SECRET : REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }
  try {
    const decoded = jwt.verify(token, secret);
    const { userId } = decoded as { userId: string };
    return userId;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};
