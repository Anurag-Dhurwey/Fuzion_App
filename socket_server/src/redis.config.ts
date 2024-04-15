import { RedisClientType, createClient, RedisFunctions, RedisModules, RedisScripts  } from "redis";
require("dotenv").config();

export const client = createClient({
  password: process.env.redis_password,
  socket: {
    host: process.env.redis_host,
    port: parseInt(process.env.redis_port || "18090"),
  },
});



export type clientType=RedisClientType & RedisModules& RedisFunctions& RedisScripts