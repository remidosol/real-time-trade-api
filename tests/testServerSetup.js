import { createServer, SocketIOServer as HttpServer } from 'http';
import { Server as SocketIOServer, Socket as ServerSocket } from 'socket.io';
import { ServerOptions } from 'engine.io';
import {
  Socket as ClientSocket,
  io as ioc,
  ManagerOptions,
} from 'socket.io-client';
import { createAdapter } from '@socket.io/redis-streams-adapter';
import Redis from 'ioredis';
import {
  OrderRepository,
  OrderService,
  OrderSocketController,
} from '../src/modules/order';
import {
  TradeRepository,
  TradeService,
  TradeSocketController,
} from '../src/modules/trade';
import { SubscriptionSocketController } from '../src/modules/subscription';
import { spyOn, SpiedFunction } from 'jest-mock';

/**
 *
 * @param {number} count
 * @param {Function} fn
 * @param {JestEnvironment.} fn
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
 * To get mock of Redis instance
 *
 * @returns {Redis}
 */
export const getRedisMock = () => {
  return new (require('ioredis-mock'))();
};

/**
 * To get mock of Redis instance
 *
 * @param {{ server: SocketIOServer | undefined; mockRedis: Redis | undefined; httpServer: HttpServer | undefined; }} cleanUpParams
 * @param {SocketIOServer | undefined} cleanUpParams.server
 * @param {Redis | undefined} cleanUpParams.mockRedis
 * @param {HttpServer | undefined} cleanUpParams.httpServer
 *
 * @returns {() => void} clean up function
 */
export const getCleanUp = ({ server, mockRedis, httpServer } = {}) => {
  return () => {
    server?.close();
    mockRedis?.quit();
    httpServer?.close();
  };
};

/**
 * To setup test server(s)
 *
 * @param {{ component: "controller"|"service"|"repository"; serverOptions?: ServerOptions; } }} setupOptions
 * @param {"controller"|"service"|"repository"} setupOptions.component
 * @param {ServerOptions} setupOptions.serverOptions
 *
 *
 * @returns {Promise<{ server: SocketIOServer; mockRedis: Redis; port: number; cleanUp: Function; mocks: { orderRepository: OrderRepository; tradeRepository: TradeRepository; orderService: OrderService; tradeService: TradeService }; spyOns: {[key: string]: { [key: string]: SpiedFunction }} }>} setupData
 * @returns {SocketIOServer} setupData.server
 * @returns {Redis} setupData.mockRedis
 * @returns {number} setupData.port
 * @returns {Function} setupData.cleanUp
 * @returns {"controller"|"service"|"repository"} setupData.component
 * @returns {{ orderRepository: OrderRepository, tradeRepository: TradeRepository, orderService: OrderService, tradeService: TradeService }} setupData.mocks
 * @returns {OrderRepository} setupData.mocks.orderRepository
 * @returns {TradeRepository} setupData.mocks.tradeRepository
 * @returns {OrderService} setupData.mocks.orderService
 * @returns {TradeService} setupData.mocks.tradeService
 * @returns {{[key: string]: { [key: string]: SpiedFunction }}} setupData.spyOns
 */
export const setup = ({
  serverOptions = {},
  component = 'repository',
} = {}) => {
  let port;
  let server;
  let mockRedis;

  return new Promise((resolve) => {
    mockRedis = getRedisMock();
    const httpServer = createServer({});

    const io = new SocketIOServer(httpServer, {
      cors: { origin: '*' },
      adapter: createAdapter(mockRedis, {
        maxLen: 45,
        streamName: 'trade_api_stream',
      }),
      ...serverOptions,
    });

    httpServer.listen(() => {
      port = httpServer.address().port;

      server = io;

      const { spyOns, mocks } = setupMocksAndSpies(
        component,
        mockRedis,
        server,
      );

      return resolve({
        server,
        mockRedis,
        port,
        cleanUp: getCleanUp({
          httpServer,
          mockRedis,
          server,
        }),
        spyOns,
        mocks,
      });
    });
  });
};

/**
 * Initializes mocks and spies based on the component type.
 *
 * @param {"controller"|"service"|"repository"} component
 * @param {Redis} redisClient
 * @param {SocketIOServer | undefined} server - The server instance; required for "controller" component, otherwise undefined.
 * @returns {{ mocks: { orderRepository: OrderRepository, tradeRepository: TradeRepository, orderService?: OrderService, tradeService?: TradeService }; spyOns: {[key: string]: { [key: string]: SpiedFunction }} }} mocks and spyOns
 */
export const setupMocksAndSpies = (component, redisClient, server) => {
  const spyOns = {};
  const orderRepository = new OrderRepository(redisClient);
  const tradeRepository = new TradeRepository(redisClient);

  // Spy on repository methods
  spyOns.orderRepository = {
    addOrder: spyOn(orderRepository, 'addOrder'),
    clearOrderBook: spyOn(orderRepository, 'clearOrderBook'),
    deleteOrder: spyOn(orderRepository, 'deleteOrder'),
    getOrder: spyOn(orderRepository, 'getOrder'),
    getTopAsks: spyOn(orderRepository, 'getTopAsks'),
    getTopBids: spyOn(orderRepository, 'getTopBids'),
    removeOrder: spyOn(orderRepository, 'removeOrder'),
    saveOrder: spyOn(orderRepository, 'saveOrder'),
    setOrderStatus: spyOn(orderRepository, 'setOrderStatus'),
    updateOrder: spyOn(orderRepository, 'updateOrder'),
  };

  spyOns.tradeRepository = {
    getRecentTrades: spyOn(tradeRepository, 'getRecentTrades'),
    getTrade: spyOn(tradeRepository, 'getTrade'),
    storeTrade: spyOn(tradeRepository, 'storeTrade'),
  };

  if (component !== 'repository') {
    let tradeService = new TradeService(tradeRepository);
    const orderService = new OrderService(orderRepository, tradeService);

    // Spy on service methods
    spyOns.orderService = {
      createOrder: spyOn(orderService, 'createOrder'),
      cancelOrder: spyOn(orderService, 'cancelOrder'),
      fillOrder: spyOn(orderService, 'fillOrder'),
    };

    tradeService = new TradeService(tradeRepository, orderService);
    spyOns.tradeService = {
      getRecentTrades: spyOn(tradeService, 'getRecentTrades'),
      matchTopOrders: spyOn(tradeService, 'matchTopOrders'),
    };

    if (component === 'controller') {
      new OrderSocketController(server, orderService);
      new SubscriptionSocketController(server, orderService);
      new TradeSocketController(server, tradeService);
    }

    return {
      spyOns,
      mocks: { orderRepository, orderService, tradeRepository, tradeService },
    };
  }

  return {
    spyOns,
    mocks: { orderRepository, tradeRepository },
  };
};
