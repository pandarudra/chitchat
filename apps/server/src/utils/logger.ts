/**
 * Lightweight structured logger.
 * - Prefixes every line with a timestamp and level tag.
 * - In production (NODE_ENV=production) debug output is suppressed.
 * - Colored output for better terminal visibility.
 */

import { IS_PRODUCTION } from "../constants/e";

const COLORS = {
  reset: "\x1b[0m",

  gray: "\x1b[90m",
  blue: "\x1b[34m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
};

function timestamp(): string {
  return new Date().toISOString();
}

function colorize(color: string, text: string): string {
  return `${color}${text}${COLORS.reset}`;
}

function format(level: string, message: string, color: string): string {
  return `${colorize(COLORS.gray, `[${timestamp()}]`)} ${colorize(
    color,
    `[${level}]`,
  )} ${message}`;
}

export const Logger = {
  info(message: string): void {
    console.log(format("INFO", message, COLORS.blue));
  },

  success(message: string): void {
    console.log(format("OK", message, COLORS.green));
  },

  warn(message: string): void {
    console.warn(format("WARN", message, COLORS.yellow));
  },

  error(message: string, error?: unknown): void {
    console.error(format("ERR", message, COLORS.red));

    if (error !== undefined) {
      console.error(colorize(COLORS.red, String(error)));
    }
  },

  /** Debug output is silenced in production. */
  debug(message: string): void {
    if (!IS_PRODUCTION) {
      console.log(format("DBG", message, COLORS.magenta));
    }
  },
};
