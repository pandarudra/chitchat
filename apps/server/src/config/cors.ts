/**
 * CORS origin configuration shared by Express middleware and Socket.IO.
 * Add production domains to the static list or set FE_URL in your .env.
 */

import { FE_URL } from "../constants/e";

const STATIC_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "https://chitchat-web-chi.vercel.app",
];

function buildAllowedOrigins(): string[] {
  if (FE_URL && !STATIC_ORIGINS.includes(FE_URL)) {
    return [...STATIC_ORIGINS, FE_URL];
  }
  return STATIC_ORIGINS;
}

/** All origins that are allowed to make credentialed cross-origin requests. */
export const allowedOrigins: string[] = buildAllowedOrigins();
