import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redis_cred = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
};

export const redisClient = new Redis(redis_cred);
// pub/sub Redis clients
export const pub = new Redis(redis_cred);
export const sub = new Redis(redis_cred);
