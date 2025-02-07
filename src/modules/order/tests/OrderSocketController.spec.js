import { Socket as ClientSocket, io as ioc } from 'socket.io-client';
import { Server, Socket as ServerSocket } from 'socket.io';
import { setup } from '../../../../tests/testServerSetup.js';
import {
  ErrorEventNames,
  IncomingEventNames,
  OutgoingEventNames,
} from '../../events/index.js';
import {
  describe,
  beforeAll,
  beforeEach,
  afterAll,
  expect,
  test,
  afterEach,
} from '@jest/globals';
import { OrderType, Sides } from '../orderConstants.js';
import { TradeStatus } from '../../trade/tradeConstants.js';
import Redis from 'ioredis';
import { SpiedFunction } from 'jest-mock';
import { v4 as uuidv4 } from 'uuid';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-order-id'),
}));

jest.mock('ioredis', () => require('ioredis-mock'));

describe('OrderSocketController', () => {
  /**
   * @type {ClientSocket}
   */
  let clientSocket;

  /**
   * @type {Server}
   */
  let server;

  /**
   * @type {ServerSocket}
   */
  let serverSocket;

  let cleanUp;

  let port;

  /**
   * @type {Redis}
   */
  let mockRedis;

  /**
   * @type {{ [key: string]: SpiedFunction }}
   */
  let mockOrderService;

  beforeAll(async () => {
    const setupData = await setup({
      component: 'controller',
    });

    mockRedis = setupData.mockRedis;
    port = setupData.port;
    cleanUp = setupData.cleanUp;
    mockOrderService = setupData.spyOns.orderService;
    server = setupData.server;
  }, 15000);

  beforeEach((done) => {
    clientSocket = ioc(`ws://localhost:${port}/order`);
    clientSocket.on('connect', () => {
      done();
    });
  }, 15000);

  afterEach((done) => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    jest.clearAllMocks();

    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
    done();
  }, 15000);

  afterAll(async () => {
    await mockRedis.flushall();
    cleanUp();
  }, 15000);

  test('should create a LIMIT order and emit ORDER_CREATED event', (done) => {
    const limitOrderData = {
      orderType: OrderType.LIMIT,
      pair: 'BTC_USD',
      price: 50000,
      quantity: 2,
      side: Sides.BUY,
    };

    const createdLimitOrder = {
      ...limitOrderData,
      orderId: 'mock-order-id',
      status: TradeStatus.OPEN,
    };

    mockOrderService.createOrder.mockResolvedValueOnce(createdLimitOrder);

    clientSocket.emit(IncomingEventNames.CREATE_ORDER, limitOrderData);

    clientSocket.on(OutgoingEventNames.ORDER_CREATED, (response) => {
      expect(response.data).toEqual(expect.objectContaining(createdLimitOrder));
      expect(mockOrderService.createOrder).toHaveBeenCalledWith(limitOrderData);
      done();
    });
  }, 15000);

  test('should create a MARKET order and emit ORDER_FILLED if executed immediately', (done) => {
    const marketOrderData = {
      orderType: OrderType.MARKET,
      pair: 'ETH_USD',
      quantity: 1,
      side: Sides.SELL,
      status: TradeStatus.OPEN,
    };

    const filledMarketOrder = {
      ...marketOrderData,
      orderId: 'mock-order-id',
      status: TradeStatus.FILLED,
    };

    mockOrderService.createOrder.mockResolvedValueOnce(filledMarketOrder);

    clientSocket.emit(IncomingEventNames.CREATE_ORDER, marketOrderData);

    clientSocket.on(OutgoingEventNames.ORDER_FILLED, (response) => {
      expect(response.data).toEqual(expect.objectContaining(filledMarketOrder));
      expect(mockOrderService.createOrder).toHaveBeenCalledWith(
        marketOrderData,
      );
      done();
    });
  }, 15000);

  test('should cancel an order and emit ORDER_CANCELLED event', (done) => {
    const orderId = 'mock-order-id';
    const canceledOrder = { orderId, status: TradeStatus.CANCELLED };

    mockOrderService.cancelOrder.mockResolvedValueOnce(canceledOrder);

    clientSocket.emit(IncomingEventNames.CANCEL_ORDER, { orderId });

    clientSocket.on(OutgoingEventNames.ORDER_CANCELLED, (response) => {
      expect(response.data).toEqual(expect.objectContaining(canceledOrder));
      expect(mockOrderService.cancelOrder).toHaveBeenCalledWith(orderId);
      done();
    });
  }, 15000);

  test('should emit ORDER_ERROR if cancelling a non-existent order', (done) => {
    const orderId = 'mocked-non-order-id';

    mockOrderService.cancelOrder.mockResolvedValueOnce(null);

    clientSocket.emit(IncomingEventNames.CANCEL_ORDER, { orderId });

    clientSocket.on(ErrorEventNames.ORDER_ERROR, (response) => {
      expect(response.message).toContain(
        `Order ${orderId} not found or already cancelled`,
      );
      done();
    });
  }, 15000);

  test('should fill an order and emit ORDER_FILLED event', (done) => {
    const orderId = 'mock-order-id';
    const filledLimitOrder = { orderId, status: TradeStatus.FILLED };

    mockOrderService.fillOrder.mockResolvedValueOnce(filledLimitOrder);

    clientSocket.emit(IncomingEventNames.FILL_ORDER, { orderId });

    clientSocket.on(OutgoingEventNames.ORDER_FILLED, (response) => {
      expect(response.data).toEqual(filledLimitOrder);
      expect(mockOrderService.fillOrder).toHaveBeenCalledWith(orderId);
      done();
    });
  }, 15000);

  test('should emit ORDER_ERROR if filling a non-existent order', (done) => {
    const orderId = 'mocked-non-order-id';

    mockOrderService.fillOrder.mockResolvedValueOnce(null);

    clientSocket.emit(IncomingEventNames.FILL_ORDER, { orderId });

    clientSocket.on(ErrorEventNames.ORDER_ERROR, (response) => {
      expect(response.message).toContain(
        `Order ${orderId} not found or can't be filled`,
      );
      done();
    });
  }, 15000);

  test('should log and emit GATEWAY_ERROR on unexpected error', (done) => {
    const orderLimitData = {
      orderType: OrderType.LIMIT,
      pair: 'BTC_USD',
      price: 50000,
      quantity: 2,
      side: Sides.BUY,
    };

    const error = new Error('Unexpected failure');
    mockOrderService.createOrder.mockRejectedValueOnce(error);

    clientSocket.emit(IncomingEventNames.CREATE_ORDER, orderLimitData);

    clientSocket.on(ErrorEventNames.GATEWAY_ERROR, (response) => {
      expect(response.message).toBe('Unexpected failure');
      done();
    });
  }, 15000);
});
