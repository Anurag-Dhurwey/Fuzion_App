import {
  RedisClientType,
  createClient,
  RedisFunctions,
  RedisModules,
  RedisScripts,
} from "redis";
import { environments } from "../environment";
require("dotenv").config();

export const client = createClient({
  password: environments.redis.password,
  socket: {
    host: environments.redis.host,
    port: environments.redis.port,
  },
});

export type clientType = RedisClientType &
  RedisModules &
  RedisFunctions &
  RedisScripts;
