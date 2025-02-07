import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from '@jest/globals';
import {
  getRedisMock,
  setupMocksAndSpies,
  getCleanUp,
} from '../../../../tests/testServerSetup.js';
import { TradeStatus } from '../../trade/tradeConstants.js';
import { Order } from '../models/Order.js';
import { OrderType, Sides } from '../orderConstants.js';
import { OrderRepository } from '../repositories/OrderRepository.js';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-order-id'),
}));

jest.mock('ioredis', () => require('ioredis-mock'));

describe('OrderRepository', () => {
  let cleanUp;

  /**
   * @type {Redis}
   */
  let mockRedis;

  /**
   * @type {OrderRepository}
   */
  let orderRepository;

  beforeAll(async () => {
    mockRedis = getRedisMock();
    orderRepository = setupMocksAndSpies('repository', mockRedis).mocks
      .orderRepository;

    cleanUp = getCleanUp({ mockRedis });
  }, 10000);

  afterEach(async () => {
    jest.clearAllMocks();
    await mockRedis.flushall();
  });

  afterAll(() => {
    cleanUp();
  });

  const sampleOrder = () => ({
    orderId: 'mocked-order-id',
    orderType: OrderType.LIMIT,
    pair: 'BTC_USD',
    price: 45000,
    quantity: 2,
    side: Sides.BUY,
    status: TradeStatus.OPEN,
  });

  test('should save and retrieve an order', async () => {
    const order = new Order(sampleOrder());
    await orderRepository.saveOrder(order);

    const retrievedOrder = await orderRepository.getOrder(order.orderId);
    expect(retrievedOrder).toEqual(order);
  });

  test('should return null for non-existing order', async () => {
    const retrievedOrder = await orderRepository.getOrder('non-existing-id');
    expect(retrievedOrder).toBeNull();
  });

  test('should delete an order', async () => {
    const order = new Order(sampleOrder());
    await orderRepository.saveOrder(order);

    await orderRepository.deleteOrder(order);
    const deletedOrder = await orderRepository.getOrder(order.orderId);
    expect(deletedOrder).toStrictEqual(order);
  });

  test('should add and remove order from order book', async () => {
    const order = new Order(sampleOrder());
    await orderRepository.addOrder(order);

    const topBids = await orderRepository.getTopBids(order.pair, 5);
    expect(topBids).toContainEqual(
      expect.objectContaining({ orderId: order.orderId }),
    );

    await orderRepository.removeOrder(order);
    const topBidsAfterRemoval = await orderRepository.getTopBids(order.pair, 5);
    expect(topBidsAfterRemoval).not.toContainEqual(
      expect.objectContaining({ orderId: order.orderId }),
    );
  });

  test('should update order details', async () => {
    const order = new Order(sampleOrder());
    await orderRepository.saveOrder(order);

    const updatedOrder = await orderRepository.updateOrder(order.orderId, {
      price: 46000,
      quantity: 3,
    });

    expect(updatedOrder.price).toBe(46000);
    expect(updatedOrder.quantity).toBe(3);
  });

  test('should handle price updates in sorted sets', async () => {
    const order = new Order(sampleOrder());
    await orderRepository.addOrder(order);

    await orderRepository.updateOrder(order.orderId, {
      price: 47000,
    });

    const topBids = await orderRepository.getTopBids(order.pair, 5);
    // console.log(updatedOrder);
    // console.log(topBids);
    expect(topBids[0].price).toBe(47000);
  });

  test('should set order status', async () => {
    const order = new Order(sampleOrder());
    await orderRepository.saveOrder(order);

    const cancelledOrder = await orderRepository.setOrderStatus(
      order.orderId,
      TradeStatus.CANCELLED,
    );
    expect(cancelledOrder.status).toBe(TradeStatus.CANCELLED);
  });

  test('should retrieve top bids and asks', async () => {
    const bidOrder = new Order({
      ...sampleOrder(),
      price: 40000,
      side: Sides.BUY,
    });
    const askOrder = new Order({
      ...sampleOrder(),
      price: 50000,
      side: Sides.SELL,
    });

    await orderRepository.addOrder(bidOrder);
    await orderRepository.addOrder(askOrder);

    const topBids = await orderRepository.getTopBids(bidOrder.pair, 1);
    expect(topBids[0].orderId).toBe(bidOrder.orderId);

    const topAsks = await orderRepository.getTopAsks(askOrder.pair, 1);
    expect(topAsks[0].orderId).toBe(askOrder.orderId);
  });

  test('should clear the order book', async () => {
    const bidOrder = new Order({
      ...sampleOrder(),
      price: 40000,
      side: Sides.BUY,
    });
    const askOrder = new Order({
      ...sampleOrder(),
      price: 50000,
      side: Sides.SELL,
    });

    await orderRepository.addOrder(bidOrder);
    await orderRepository.addOrder(askOrder);

    await orderRepository.clearOrderBook(bidOrder.pair);

    const topBids = await orderRepository.getTopBids(bidOrder.pair, 1);
    const topAsks = await orderRepository.getTopAsks(askOrder.pair, 1);
    expect(topBids.length).toBe(0);
    expect(topAsks.length).toBe(0);
  });
});
