import { createServer } from 'http';
import { Server, Socket as ServerSocket } from 'socket.io';
import { ServerOptions } from 'engine.io';
import {
  Socket as ClientSocket,
  io as ioc,
  ManagerOptions,
} from 'socket.io-client';
import { createAdapter } from '@socket.io/redis-streams-adapter';
import Redis from 'ioredis';

/**
 *
 * @param {number} count
 * @param {Function} fn
 * @returns
 */
export const times = (count, fn) => {
  let i = 0;

  return () => {
    i++;
    if (i === count) {
      fn();
    } else if (i > count) {
      throw new Error(`too many calls: ${i} instead of ${count}`);
    }
  };
};

/**
 * To sleep for a duration
 *
 * @param {number} duration
 */
export const sleep = (duration) => {
  return new Promise((resolve) => setTimeout(resolve, duration));
};

/**
 * To throw an error when called
 *
 * @param {Function} done
 */
export const shouldNotHappen = (done) => {
  return () => done(new Error('should not happen'));
};

/**
 * Default number of nodes
 * @type {number}
 */
const NODES_COUNT = 1;

/**
 * To setup test server(s)
 *
 * @param {{ nodeCount: number, serverOptions?: ServerOptions, clientOptions?: ManagerOptions } }} setupOptions
 *
 * @returns {Promise<{server: Server; serverSockets: ServerSocket[]; clientSockets: ClientSocket[]; mockRedisClients: Redis[]; ports: string[]; cleanup: () => void; ports: number[]}>}
 */
export const setup = ({
  nodeCount = NODES_COUNT,
  serverOptions = {},
  clientOptions = {},
} = {}) => {
  let server = null;
  const serverSockets = [];
  const clientSockets = [];
  const mockRedisClients = [];
  const ports = [];

  return new Promise((resolve) => {
    for (let i = 1; i <= nodeCount; i++) {
      const redisClient = new (require('ioredis-mock'))();

      const httpServer = createServer({});
      const io = new Server(httpServer, {
        cors: { origin: '*' },
        adapter: createAdapter(redisClient, {
          maxLen: 45,
          streamName: 'trade_api_stream',
        }),
        ...serverOptions,
      });

      httpServer.listen(() => {
        const port = httpServer.address().port;
        const clientSocket = ioc(`ws://localhost:${port}`, {
          ...clientOptions,
        });

        io.on('connection', async (socket) => {
          clientSockets.push(clientSocket);
          serverSockets.push(socket);
          server = io;
          mockRedisClients.push(redisClient);
          ports.push(port);

          if (server) {
            server.emit('ping');

            await sleep(200);

            resolve({
              server,
              serverSockets,
              clientSockets,
              mockRedisClients,
              ports,
              cleanup: () => {
                server.close();
                serverSockets.forEach((socket) => socket.disconnect());
                clientSockets.forEach((socket) => socket.disconnect());
                mockRedisClients.forEach((redisClient) => redisClient.quit());
              },
            });
          }
        });
      });
    }
  });
};
