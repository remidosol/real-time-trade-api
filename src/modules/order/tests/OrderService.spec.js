import { OrderService } from '../services/OrderService.js';
import { Order } from '../models/Order.js';
import { OrderType, Sides } from '../orderConstants.js';
import { TradeStatus } from '../../trade/tradeConstants.js';
import {
  getRedisMock,
  setupMocksAndSpies,
  getCleanUp,
} from '../../../../tests/testServerSetup.js';
import {
  describe,
  beforeAll,
  afterAll,
  expect,
  beforeEach,
  test,
  afterEach,
} from '@jest/globals';
import Redis from 'ioredis';
import { SpiedFunction } from 'jest-mock';
import { TradeService } from '../../trade/index.js';
import { v4 as uuidv4 } from 'uuid';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-order-id'),
}));

jest.mock('ioredis', () => require('ioredis-mock'));

describe('OrderService', () => {
  let cleanUp;

  /**
   * @type {Redis}
   */
  let mockRedis;

  /**
   * @type {OrderService}
   */
  let orderService;

  /**
   * @type {TradeService}
   */
  let mockTradeService;

  /**
   * @type {{[key: string]: SpiedFunction}}
   */
  let mockOrderRepository;

  beforeAll(async () => {
    mockRedis = getRedisMock();
    const mocksAndSpies = setupMocksAndSpies('service', mockRedis);
    orderService = mocksAndSpies.mocks.orderService;

    mockOrderRepository = mocksAndSpies.spyOns.orderRepository;
    mockTradeService = mocksAndSpies.spyOns.orderRepository;

    cleanUp = getCleanUp({ mockRedis });
  }, 10000);

  afterEach(async () => {
    jest.clearAllMocks();
    await mockRedis.flushall();
  });

  afterAll(() => {
    cleanUp();
  });

  test('should create a LIMIT order and store it', async () => {
    const orderData = {
      orderType: OrderType.LIMIT,
      pair: 'BTC_USD',
      price: 50000,
      quantity: 2,
      side: Sides.BUY,
    };

    const expectedOrder = new Order({
      ...orderData,
      orderId: 'mocked-order-id',
      status: TradeStatus.OPEN,
    });

    mockOrderRepository.addOrder.mockResolvedValueOnce(expectedOrder);

    const createdOrder = await orderService.createOrder(orderData);

    expect(mockOrderRepository.addOrder).toHaveBeenCalledTimes(1);
    expect(createdOrder.orderType).toBe(OrderType.LIMIT);
    expect(createdOrder.status).toBe(TradeStatus.OPEN);
  });

  test('should create a MARKET order and execute immediately if matched', async () => {
    const orderData = {
      orderType: OrderType.MARKET,
      pair: 'mocked-order-id',
      quantity: 1,
      side: Sides.SELL,
    };

    const matchedTrade = { tradeId: 'trade123', pair: 'ETH_USD' };
    mockTradeService.matchTopOrders.mockResolvedValueOnce(matchedTrade);

    const createdOrder = await orderService.createOrder(orderData);

    expect(mockTradeService.matchTopOrders).toHaveBeenCalledWith('ETH_USD');
    expect(createdOrder.status).toBe(TradeStatus.FILLED);
    expect(mockOrderRepository.addOrder).not.toHaveBeenCalled();
  });

  test('should store a MARKET order if no match is found', async () => {
    const orderData = {
      orderType: OrderType.MARKET,
      pair: 'ETH_USD',
      quantity: 1,
      side: Sides.SELL,
    };

    mockTradeService.matchTopOrders.mockResolvedValueOnce(null);

    const createdOrder = await orderService.createOrder(orderData);

    expect(mockTradeService.matchTopOrders).toHaveBeenCalled();
    expect(mockOrderRepository.addOrder).toHaveBeenCalled();
    expect(createdOrder.status).toBe(TradeStatus.OPEN);
  });

  test('should retrieve an order by ID', async () => {
    const orderId = 'mocked-order-id';
    const order = new Order({
      orderId,
      orderType: OrderType.LIMIT,
      pair: 'BTC_USD',
      price: 50000,
      quantity: 2,
      side: Sides.BUY,
      status: TradeStatus.OPEN,
    });

    mockOrderRepository.getOrder.mockResolvedValueOnce(order);

    const retrievedOrder = await orderService.getOrder(orderId);

    expect(mockOrderRepository.getOrder).toHaveBeenCalledWith(orderId);
    expect(retrievedOrder).toEqual(order);
  });

  test('should cancel an order', async () => {
    const orderId = 'mocked-order-id';
    const canceledOrder = { orderId, status: TradeStatus.CANCELLED };

    mockOrderRepository.setOrderStatus.mockResolvedValueOnce(canceledOrder);

    const result = await orderService.cancelOrder(orderId);

    expect(mockOrderRepository.setOrderStatus).toHaveBeenCalledWith(
      orderId,
      TradeStatus.CANCELLED,
    );
    expect(result.status).toBe(TradeStatus.CANCELLED);
  });

  test('should fill an order if it is OPEN', async () => {
    const orderId = 'mocked-order-id';
    const order = {
      orderId,
      status: TradeStatus.OPEN,
    };

    mockOrderRepository.getOrder.mockResolvedValueOnce(order);
    mockOrderRepository.setOrderStatus.mockResolvedValueOnce({
      ...order,
      status: TradeStatus.FILLED,
    });

    const result = await orderService.fillOrder(orderId);

    expect(mockOrderRepository.getOrder).toHaveBeenCalledWith(orderId);
    expect(mockOrderRepository.setOrderStatus).toHaveBeenCalledWith(
      orderId,
      TradeStatus.FILLED,
    );
    expect(result.status).toBe(TradeStatus.FILLED);
  });

  test('should return null if order is already filled or cancelled', async () => {
    const orderId = 'mocked-non-order-id';
    const order = {
      orderId,
      status: TradeStatus.CANCELLED,
    };

    mockOrderRepository.getOrder.mockResolvedValueOnce(order);

    const result = await orderService.fillOrder(orderId);

    expect(mockOrderRepository.getOrder).toHaveBeenCalledWith(orderId);
    expect(mockOrderRepository.setOrderStatus).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  test('should update an order', async () => {
    const orderId = 'mocked-order-id';
    const updatedOrder = {
      orderId,
      price: 51000,
    };

    mockOrderRepository.updateOrder.mockResolvedValueOnce(updatedOrder);

    const result = await orderService.updateOrder(orderId, { price: 51000 });

    expect(mockOrderRepository.updateOrder).toHaveBeenCalledWith(orderId, {
      price: 51000,
    });
    expect(result.price).toBe(51000);
  });

  test('should return top N bids', async () => {
    const bids = [{ orderId: 'mocked-order-id', price: 49000 }];
    mockOrderRepository.getTopBids.mockResolvedValueOnce(bids);

    const result = await orderService.getTopBids('BTC_USD', 5);

    expect(mockOrderRepository.getTopBids).toHaveBeenCalledWith('BTC_USD', 5);
    expect(result).toEqual(bids);
  });

  test('should return top N asks', async () => {
    const asks = [{ orderId: 'mocked-order-id', price: 51000 }];
    mockOrderRepository.getTopAsks.mockResolvedValueOnce(asks);

    const result = await orderService.getTopAsks('BTC_USD', 5);

    expect(mockOrderRepository.getTopAsks).toHaveBeenCalledWith('BTC_USD', 5);
    expect(result).toEqual(asks);
  });

  test('should clear the order book', async () => {
    mockOrderRepository.clearOrderBook.mockResolvedValueOnce(undefined);

    await orderService.clearOrderBook('BTC_USD');

    expect(mockOrderRepository.clearOrderBook).toHaveBeenCalledWith('BTC_USD');
  });
});
