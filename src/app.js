import { createAdapter } from '@socket.io/redis-streams-adapter';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import { fileURLToPath } from 'url';
import xss from 'xss-clean';
import redisClient from './core/config/redisClient.js';
import logger from './core/logger/logger.js';
import { errorConverter, errorHandler } from './core/middlewares/index.js';
import { OrderGateway } from './order/orderGateway.js';
import { SubscriptionGateway } from './subscription/subscriptionGateway.js';
import { TradeGateway } from './trade/tradeGateway.js';

const app = express();

app.use(helmet());
app.use(xss());
app.use(cors());
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer({}, app);

const io = new SocketIOServer(server, {
  cors: { origin: '*' },
  adapter: createAdapter(redisClient.getClient(), {
    maxLen: 45,
    streamName: 'trade_api_stream',
  }),
});

io.on('connection', async (socket) => {
  logger.debug(`Client (${socket.id}) connected.`);

  socket.on('disconnect', () => {
    logger.debug(`Client (${socket.id}) disconnected.`);
  });
});

new OrderGateway(io.of('/order'), io);
new SubscriptionGateway(io.of('/subscription'));
new TradeGateway(io.of('/trade'));

app.get('/', (_req, res) => {
  res.send('Hello from Real-Time Trading API!');
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/docs', express.static(path.join(__dirname, '../docs')));

app.use(errorConverter);
app.use(errorHandler);

export default server;
