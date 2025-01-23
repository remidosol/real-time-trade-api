import Redis from 'ioredis';
import dotenv from 'dotenv';
import logger from '../core/logger/Logger.js';

dotenv.config({});

class RedisClient {
  #client;

  constructor() {
    this.#client = new Redis({
      host: process.env.REDIS_HOST,
      port: +process.env.REDIS_PORT,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      autoResubscribe: true,
      autoResendUnfulfilledCommands: true,
    });

    this.#client.on('error', (err) => {
      logger.error('Redis Client Error: ', err);
    });

    this.#client.on('connect', () => {
      logger.info('Redis client connected.');
    });

    this.#client.on('ready', () => {
      logger.info('Redis client is ready.');
    });

    this.#client.on('reconnecting', () => {
      logger.info('Redis client is reconnecting.');
    });
  }

  /**
   * Connect to Redis client
   */
  async connect() {
    return this.#client.connect();
  }

  /**
   * Disconnect from Redis Client
   */
  disconnect() {
    this.#client.disconnect();
  }

  /**
   * To get client instance of Redis
   *
   * @returns {Redis} Redis client
   */
  getClient() {
    return this.#client;
  }
}

const redisClient = new RedisClient();

export default redisClient;
