import Redis from 'ioredis';
import env from './env.js';
import logger from '../core/logger/Logger.js';

class RedisClient {
  #client;

  constructor() {
    this.#client = new Redis({
      host: env.REDIS_HOST,
      port: +env.REDIS_PORT,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      autoResubscribe: true,
      autoResendUnfulfilledCommands: true,
    });

    this.#client.on('error', (error) => {
      console.log(error);
      logger.error({
        ...error,
        context: '[RedisClient]',
        error,
      });
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
