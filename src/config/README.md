# Configuration Directory

The `config` directory is a central hub for managing and organizing your application's configuration settings. It encapsulates environment variable management, Redis client setup, and ensures that your application operates with validated and secure configurations.

## Table of Contents

- [Overview](#overview)
- [Environment Configuration (`env.js`)](#environment-configuration-envjs)
  - [Environment Variables](#environment-variables)
  - [Validation with Zod](#validation-with-zod)
  - [Logging Configuration Errors](#logging-configuration-errors)
- [Redis Client Configuration (`RedisClient.js`)](#redis-client-configuration-redisclientjs)
  - [Redis Connection Setup](#redis-connection-setup)
  - [Event Listeners](#event-listeners)
  - [Client Methods](#client-methods)
  - [Usage in Application](#usage-in-application)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The `config` directory houses essential configuration files that dictate how your application behaves in different environments and interacts with external services like Redis. Proper management of configurations ensures that your application remains flexible, secure, and maintainable.

## Environment Configuration (`env.js`)

The `env.js` file is responsible for loading, validating, and exporting environment variables required by your application.

### Environment Variables

Environment variables are critical for configuring your application across various environments (development, testing, production). The `env.js` file utilizes the [`dotenv`](https://github.com/motdotla/dotenv) package to load variables from a `.env` file into `process.env`.

**Supported Variables:**

| Variable     | Type   | Description                        | Default     |
| ------------ | ------ | ---------------------------------- | ----------- |
| `NODE_ENV`   | Enum   | Specifies the environment           | **Required**: `prod`, `dev`, `test` |
| `PORT`       | String | Port number on which the server runs | `3333`      |
| `REDIS_HOST` | String | Host address for the Redis server   | `localhost` |
| `REDIS_PORT` | String | Port number for the Redis server    | `6379`      |

### Validation with Zod

To ensure that all necessary environment variables are present and correctly formatted, the `env.js` file employs [`zod`](https://github.com/colinhacks/zod) for schema validation.

```javascript
const envVarsSchema = z.object({
  NODE_ENV: z.enum(['prod', 'dev', 'test']),
  PORT: z.string().default('3333'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
});
```

### Logging Configuration Errors

If the environment variables fail validation, the application logs detailed error messages using the custom `logger` from the `core/logger/Logger.js` module.

```javascript
if (!success && error) {
  logger.error('Config validation error', { error: error.issues });
}
```

**Note:** Ensure that all required environment variables are defined in your `.env` file to prevent runtime errors.

## Redis Client Configuration (`RedisClient.js`)

The `RedisClient.js` file sets up and manages the Redis client connection using the [`ioredis`](https://github.com/luin/ioredis) library.

### Redis Connection Setup

The Redis client is configured with essential connection parameters loaded from environment variables. It includes retry strategies and options to enhance connection reliability.

```javascript
this.#client = new Redis({
  host: process.env.REDIS_HOST,
  port: +process.env.REDIS_PORT,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  autoResubscribe: true,
  autoResendUnfulfilledCommands: true,
});
```

### Event Listeners

To monitor and log the state of the Redis connection, several event listeners are attached:

- **`error`**: Logs any connection errors.
- **`connect`**: Confirms when the client successfully connects.
- **`ready`**: Indicates that the client is ready to use.
- **`reconnecting`**: Notifies when the client attempts to reconnect.

```javascript
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
```

### Client Methods

The `RedisClient` class provides the following methods to interact with Redis:

- **`connect()`**: Establishes a connection to the Redis server.
- **`disconnect()`**: Gracefully disconnects from the Redis server.
- **`getClient()`**: Retrieves the underlying Redis client instance for direct interactions.

```javascript
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
```

### Usage in Application

To utilize the Redis client within your application:

1. **Import the Redis Client:**

   ```javascript
   import redisClient from './config/RedisClient.js';
   ```

2. **Connect to Redis:**

   ```javascript
   await redisClient.connect();
   ```

3. **Perform Redis Operations:**

   ```javascript
   const client = redisClient.getClient();
   await client.set('key', 'value');
   const value = await client.get('key');
   ```

4. **Disconnect When Needed:**

   ```javascript
   redisClient.disconnect();
   ```

**Example:**

```javascript
import redisClient from './config/RedisClient.js';

(async () => {
  try {
    await redisClient.connect();
    const client = redisClient.getClient();

    await client.set('user:1', JSON.stringify({ name: 'John Doe', age: 30 }));
    const user = await client.get('user:1');
    console.log(JSON.parse(user));
  } catch (error) {
    console.error('Redis Operation Error:', error);
  } finally {
    redisClient.disconnect();
  }
})();
```

## Best Practices

1. **Secure Environment Variables:**
   - Store sensitive information like API keys, database credentials, and secrets in the `.env` file.
   - Ensure `.env` is included in `.gitignore` to prevent accidental commits to version control.

2. **Validate All Configurations:**
   - Use schema validation (like Zod) to enforce the presence and correct format of environment variables.
   - Log and handle configuration errors gracefully to prevent unexpected application behavior.

3. **Centralize Configuration Management:**
   - Keep all configuration-related files within the `config` directory for easy access and management.
   - Avoid scattering configuration logic across different parts of the application.

4. **Handle Redis Connections Carefully:**
   - Implement robust error handling and reconnection strategies to maintain Redis reliability.
   - Close Redis connections gracefully to prevent memory leaks or dangling connections.

5. **Use Environment-Specific Configurations:**
   - Maintain separate `.env` files for different environments (development, testing, production) if necessary.
   - Load configurations based on the `NODE_ENV` variable to switch contexts seamlessly.

## Troubleshooting

- **Configuration Validation Errors:**
  - **Issue:** Application logs a "Config validation error" with details.
  - **Solution:** Ensure all required environment variables are defined and correctly formatted in your `.env` file.

- **Redis Connection Issues:**
  - **Issue:** Redis client fails to connect or frequently reconnects.
  - **Solution:**
    - Verify Redis server is running and accessible at the specified `REDIS_HOST` and `REDIS_PORT`.
    - Check network configurations and firewall settings.
    - Review Redis server logs for any errors or issues.

- **Unhandled Exceptions:**
  - **Issue:** Errors during Redis operations or configuration parsing.
  - **Solution:** Implement comprehensive error handling in your application and review logs for detailed error messages.
