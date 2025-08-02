import Redis from "ioredis";
export const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  // username: process.env.REDIS_USERNAME,
  // password: process.env.REDIS_PASSWORD,
});
