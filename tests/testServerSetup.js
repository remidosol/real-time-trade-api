import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server, Socket as ServerSocket } from 'socket.io';
import { ServerOptions } from 'engine.io';
import { Socket as ClientSocket } from 'socket.io-client';
import { createAdapter } from '@socket.io/redis-streams-adapter';
import Redis from 'ioredis';

dotenv.config({});

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

const initRedisClient = async () => {
  return new Redis();
};

/**
 * Default number of nodes
 * @type {number}
 */
const NODES_COUNT = 1;

/**
 * To setup test server(s)
 *
 * @param {{ nodeCount: number, serverOptions?: ServerOptions } }} setupOptions
 *
 * @returns {Promise<{server: Server; serverSockets: ServerSocket[]; clientSockets: ClientSocket[]; cleanup: () => void; ports: number[]}>}
 */
export const setup = ({ nodeCount = NODES_COUNT, serverOptions = {} } = {}) => {
  let server = null;
  const serverSockets = [];
  const clientSockets = [];
  const redisClients = [];
  const ports = [];

  return new Promise(async (resolve) => {
    for (let i = 1; i <= nodeCount; i++) {
      const redisClient = await initRedisClient();

      const httpServer = createServer();
      const io = new Server(httpServer, {
        adapter: createAdapter(redisClient),
        ...serverOptions,
      });

      httpServer.listen(() => {
        const port = httpServer.address().port;
        const clientSocket = ioc(`http://localhost:${port}`);

        io.on('connection', async (socket) => {
          clientSockets.push(clientSocket);
          serverSockets.push(socket);
          server = io;
          redisClients.push(redisClient);
          ports.push(port);

          if (server) {
            server.emit('ping');

            await sleep(200);

            resolve({
              server,
              serverSockets,
              clientSockets,
              ports,
              cleanup: () => {
                server.close();
                clientSockets.forEach((socket) => socket.disconnect());
                redisClients.forEach((redisClient) => redisClient.quit());
              },
            });
          }
        });
      });
    }
  });
};
