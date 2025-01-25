import { OrderService } from '../services/OrderService.js';
import { Order } from '../models/Order.js';
import { OrderType, Sides } from '../orderConstants.js';
import { TradeStatus } from '../../trade/tradeConstants.js';
import { setup } from '../../../../tests/testServerSetup.js';
import {
  describe,
  beforeAll,
  afterAll,
  expect,
  beforeEach,
  test,
} from '@jest/globals';
import Redis from 'ioredis';

jest.mock('ioredis', () => require('ioredis-mock'));
jest.mock('../repositories/OrderRepository.js');
jest.mock('../../trade/services/TradeService.js');
jest.mock('../../trade/repositories/TradeRepository.js');

describe('OrderService', () => {
  let mockOrderRepository, mockTradeService;

  let cleanup;

  /**
   * @type {Redis}
   */
  let mockRedis;

  /**
   * @type {OrderService}
   */
  let orderService;

  beforeAll(async () => {
    mockOrderRepository = {
      addOrder: jest.fn(),
      getOrder: jest.fn(),
      setOrderStatus: jest.fn(),
      updateOrder: jest.fn(),
      getTopBids: jest.fn(),
      getTopAsks: jest.fn(),
      clearOrderBook: jest.fn(),
    };

    mockTradeService = {
      matchTopOrders: jest.fn(),
    };

    const setupData = await setup();
    mockRedis = setupData.mockRedisClients[0];
    cleanup = setupData.cleanup;

    orderService = new OrderService(mockOrderRepository, mockTradeService);
  }, 10000);

  beforeEach(async () => {
    jest.clearAllMocks();
    await mockRedis.flushall();
  });

  afterAll(() => {
    cleanup();
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
      pair: 'ETH_USD',
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
    const orderId = 'order-123';
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
    const orderId = 'order-456';
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
    const orderId = 'order-789';
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
    const orderId = 'order-999';
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
    const orderId = 'order-101';
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
    const bids = [{ orderId: 'bid-1', price: 49000 }];
    mockOrderRepository.getTopBids.mockResolvedValueOnce(bids);

    const result = await orderService.getTopBids('BTC_USD', 5);

    expect(mockOrderRepository.getTopBids).toHaveBeenCalledWith('BTC_USD', 5);
    expect(result).toEqual(bids);
  });

  test('should return top N asks', async () => {
    const asks = [{ orderId: 'ask-1', price: 51000 }];
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
