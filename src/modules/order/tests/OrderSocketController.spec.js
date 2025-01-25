jest.mock('ioredis', () => require('ioredis-mock'));

// jest.mock('../services/OrderService.js', () => ({
//   orderService: {
//     createOrder: jest.fn(),
//     cancelOrder: jest.fn(),
//     fillOrder: jest.fn(),
//   },
// }));

import { Socket as ClientSocket } from 'socket.io-client';
import { setup } from '../../../../tests/testServerSetup.js';
import {
  IncomingEventNames,
  OutgoingEventNames,
  ErrorEventNames,
} from '../../events/index.js';
import {
  describe,
  beforeAll,
  afterAll,
  expect,
  beforeEach,
  test,
} from '@jest/globals';
import { OrderType, Sides } from '../orderConstants.js';
import { TradeStatus } from '../../trade/tradeConstants.js';
// import { OrderService, orderService } from '../services/OrderService.js';

describe('OrderSocketController', () => {
  /**
   * @type {ClientSocket}
   */
  let clientSocket;

  let cleanup;

  /**
   * @type {Redis}
   */
  let mockRedis;

  /**
   * @type {OrderService}
   */
  const orderService = {
    createOrder: jest.fn(),
    cancelOrder: jest.fn(),
    fillOrder: jest.fn(),
  };

  beforeAll(async () => {
    const setupData = await setup({
      clientOptions: { path: '/socket.io/order' },
    });

    clientSocket = setupData.clientSockets[0];
    mockRedis = setupData.mockRedisClients[0];
    cleanup = setupData.cleanup;

    // orderService = {
    //   createOrder: jest.fn(),
    //   cancelOrder: jest.fn(),
    //   fillOrder: jest.fn(),
    // };
  }, 10000);

  beforeEach(async () => {
    jest.clearAllMocks();
    await mockRedis.flushall();
  });

  afterAll(() => {
    cleanup();
  });

  test('should create a LIMIT order and emit ORDER_CREATED event', (done) => {
    const orderData = {
      orderType: OrderType.LIMIT,
      pair: 'BTC_USD',
      price: 50000,
      quantity: 2,
      side: Sides.BUY,
    };

    const createdOrder = {
      ...orderData,
      orderId: 'order-123',
      status: TradeStatus.OPEN,
    };

    orderService.createOrder.mockResolvedValueOnce(createdOrder);

    clientSocket.emit(IncomingEventNames.CREATE_ORDER, orderData);

    clientSocket.on(OutgoingEventNames.ORDER_CREATED, (response) => {
      expect(response.data).toEqual(createdOrder);
      expect(orderService.createOrder).toHaveBeenCalledWith(orderData);
      done();
    });
  });

  test('should create a MARKET order and emit ORDER_FILLED if executed immediately', (done) => {
    const orderData = {
      orderType: OrderType.MARKET,
      pair: 'ETH_USD',
      quantity: 1,
      side: Sides.SELL,
    };

    const filledOrder = {
      ...orderData,
      orderId: 'order-456',
      status: TradeStatus.FILLED,
    };

    orderService.createOrder.mockResolvedValueOnce(filledOrder);

    clientSocket.emit(IncomingEventNames.CREATE_ORDER, orderData);

    clientSocket.on(OutgoingEventNames.ORDER_FILLED, (response) => {
      expect(response.data).toEqual(filledOrder);
      expect(orderService.createOrder).toHaveBeenCalledWith(orderData);
      done();
    });
  });

  test('should cancel an order and emit ORDER_CANCELLED event', (done) => {
    const orderId = 'order-789';
    const canceledOrder = { orderId, status: TradeStatus.CANCELLED };

    orderService.cancelOrder.mockResolvedValueOnce(canceledOrder);

    clientSocket.emit(IncomingEventNames.CANCEL_ORDER, { orderId });

    clientSocket.on(OutgoingEventNames.ORDER_CANCELLED, (response) => {
      expect(response.data).toEqual(canceledOrder);
      expect(orderService.cancelOrder).toHaveBeenCalledWith(orderId);
      done();
    });
  });

  test('should emit ORDER_ERROR if cancelling a non-existent order', (done) => {
    const orderId = 'order-999';

    orderService.cancelOrder.mockResolvedValueOnce(null);

    clientSocket.emit(IncomingEventNames.CANCEL_ORDER, { orderId });

    clientSocket.on(ErrorEventNames.ORDER_ERROR, (response) => {
      expect(response.message).toContain('not found or already cancelled');
      done();
    });
  });

  test('should fill an order and emit ORDER_FILLED event', (done) => {
    const orderId = 'order-567';
    const filledOrder = { orderId, status: TradeStatus.FILLED };

    orderService.fillOrder.mockResolvedValueOnce(filledOrder);

    clientSocket.emit(IncomingEventNames.FILL_ORDER, { orderId });

    clientSocket.on(OutgoingEventNames.ORDER_FILLED, (response) => {
      expect(response.data).toEqual(filledOrder);
      expect(orderService.fillOrder).toHaveBeenCalledWith(orderId);
      done();
    });
  });

  test('should emit ORDER_ERROR if filling a non-existent order', (done) => {
    const orderId = 'order-999';

    orderService.fillOrder.mockResolvedValueOnce(null);

    clientSocket.emit(IncomingEventNames.FILL_ORDER, { orderId });

    clientSocket.on(ErrorEventNames.ORDER_ERROR, (response) => {
      expect(response.message).toContain("not found or can't be filled");
      done();
    });
  });

  test('should log and emit GATEWAY_ERROR on unexpected error', (done) => {
    const orderData = {
      orderType: OrderType.LIMIT,
      pair: 'BTC_USD',
      price: 50000,
      quantity: 2,
      side: Sides.BUY,
    };

    const error = new Error('Unexpected failure');
    orderService.createOrder.mockRejectedValueOnce(error);

    clientSocket.emit(IncomingEventNames.CREATE_ORDER, orderData);

    clientSocket.on(ErrorEventNames.GATEWAY_ERROR, (response) => {
      expect(response.message).toBe('Unexpected failure');
      done();
    });
  });
});
