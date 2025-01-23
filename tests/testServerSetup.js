import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import http from 'http';
import { Server } from 'socket.io';
import { EventSchemas } from '../src/core/events/index';
import logger from '../src/core/logger/logger';
import { socketDtoMiddleware } from '../src/core/middlewares';
import { OrderSocketController } from '../src/order/orderGateway';
import { TradeSocketController } from '../src/trade/tradeGateway';
import { SubscriptionSocketController } from '../src/subscription/subscriptionGateway';

/**
 * Creates a test server with Express & Socket.IO,
 * but does NOT start listening on a fixed port. Instead, we let Node pick a free port.
 */
export async function createTestServer() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*' },
  });

  // Example minimal events in test mode
  io.on('connection', (socket) => {
    logger.debug(`Test client connected: ${socket.id}`);

    // If you want a test "pingTest" event
    socket.on('pingTest', () => {
      socket.emit('pongTest');
    });

    socket.on('disconnected', () => {
      logger.debug(`Test client disconnected: ${socket.id}`);
    });
  });

  // If you want to use your actual Gateways:
  io.use(socketDtoMiddleware(EventSchemas));

  new OrderSocketController(io);
  new SubscriptionSocketController(io);
  new TradeSocketController(io);

  app.get('/', (_req, res) => {
    res.send('Hello from Real-Time Trading API!');
  });

  // Listen on an ephemeral port (0) so we don't conflict
  await new Promise((resolve) => {
    server.listen(0, () => {
      resolve();
    });
  });

  return { server, io };
}
