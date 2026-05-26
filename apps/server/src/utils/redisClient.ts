import Redis from "ioredis";
import { Logger } from "./logger";
import { REDIS_HOST, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD } from "../constants/e";

// Redis credentials are read from environment; dotenv.config() is called once
// in index.ts before any module is imported.
const redis_cred = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  username: REDIS_USERNAME,
  password: REDIS_PASSWORD,
};

function createClient(name: string): Redis {
  const client = new Redis(redis_cred);

  client.on("error", (err) => {
    Logger.error(`[Redis:${name}] Connection error`, err);
  });

  client.on("connect", () => {
    Logger.info(`[Redis:${name}] Connected`);
  });

  return client;
}

/** General-purpose Redis client (get/set/del/keys). */
export const redisClient = createClient("main");

/** Publisher client — used to broadcast messages across server instances. */
export const pub = createClient("pub");

/** Subscriber client — listens on pub/sub channels. */
export const sub = createClient("sub");
