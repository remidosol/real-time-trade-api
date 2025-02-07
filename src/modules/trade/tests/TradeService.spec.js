import { TradeService } from '../services/TradeService.js';
import { Trade } from '../models/Trade.js';
import { TradeStatus } from '../tradeConstants.js';
import {
  getCleanUp,
  getRedisMock,
  setupMocksAndSpies,
} from '../../../../tests/testServerSetup.js';
import { TradeRepository } from '../repositories/TradeRepository.js';
import { OrderService } from '../../order/index.js';
import {
  describe,
  beforeAll,
  afterAll,
  expect,
  afterEach,
} from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-trade-id'),
}));

describe('TradeService', () => {
  let cleanUp;

  /**
   * @type {Redis}
   */
  let mockRedis;

  /**
   * @type {TradeRepository}
   */
  let tradeRepository;

  /**
   * @type {OrderService}
   */
  let orderService;

  /**
   * @type {TradeService}
   */
  let tradeService;

  beforeAll(async () => {
    mockRedis = getRedisMock();
    const mocksAndSpies = setupMocksAndSpies('service', mockRedis);
    tradeService = mocksAndSpies.mocks.tradeService;

    tradeRepository = mocksAndSpies.spyOns.tradeRepository;
    orderService = mocksAndSpies.spyOns.orderService;

    cleanUp = getCleanUp({ mockRedis });
  }, 10000);

  afterEach(async () => {
    jest.clearAllMocks();
    await mockRedis.flushall();
  });

  afterAll(() => {
    cleanUp();
  });

  describe('matchTopOrders', () => {
    test('should return null when no matching orders exist', async () => {
      orderService.getTopBids.mockResolvedValueOnce([]);
      orderService.getTopAsks.mockResolvedValueOnce([]);

      const result = await tradeService.matchTopOrders('BTC_USD');

      expect(result).toBeNull();
      expect(orderService.getTopBids).toHaveBeenCalledWith('BTC_USD', 1);
      expect(orderService.getTopAsks).toHaveBeenCalledWith('BTC_USD', 1);
      expect(tradeRepository.storeTrade).not.toHaveBeenCalled();
    });

    test('should return null when top bid price is lower than top ask price', async () => {
      orderService.getTopBids.mockResolvedValueOnce([
        {
          orderId: 'bid1',
          price: 48000,
          quantity: 1,
          status: TradeStatus.OPEN,
        },
      ]);

      orderService.getTopAsks.mockResolvedValueOnce([
        {
          orderId: 'ask1',
          price: 50000,
          quantity: 1,
          status: TradeStatus.OPEN,
        },
      ]);

      const result = await tradeService.matchTopOrders('BTC_USD');

      expect(result).toBeNull();
      expect(tradeRepository.storeTrade).not.toHaveBeenCalled();
    });

    test('should execute a trade and store it when bid and ask match', async () => {
      orderService.getTopBids.mockResolvedValueOnce([
        {
          orderId: 'bid1',
          price: 50000,
          quantity: 2,
          status: TradeStatus.OPEN,
        },
      ]);
      orderService.getTopAsks.mockResolvedValueOnce([
        {
          orderId: 'ask1',
          price: 50000,
          quantity: 1,
          status: TradeStatus.OPEN,
        },
      ]);

      const result = await tradeService.matchTopOrders('BTC_USD');

      expect(result).toBeInstanceOf(Trade);
      expect(result).toEqual({
        tradeId: 'mocked-trade-id',
        pair: 'BTC_USD',
        buyOrderId: 'bid1',
        sellOrderId: 'ask1',
        quantity: 1,
        price: 50000,
        timestamp: expect.any(Number),
      });

      expect(tradeRepository.storeTrade).toHaveBeenCalledWith(
        expect.objectContaining({
          tradeId: 'mocked-trade-id',
          pair: 'BTC_USD',
        }),
      );

      expect(orderService.fillOrder).toHaveBeenCalledWith('ask1');
      expect(orderService.updateOrder).toHaveBeenCalledWith('bid1', {
        quantity: 1,
      });
    });

    test('should fully fill both orders when quantities match', async () => {
      orderService.getTopBids.mockResolvedValueOnce([
        {
          orderId: 'bid1',
          price: 50000,
          quantity: 1,
          status: TradeStatus.OPEN,
        },
      ]);
      orderService.getTopAsks.mockResolvedValueOnce([
        {
          orderId: 'ask1',
          price: 50000,
          quantity: 1,
          status: TradeStatus.OPEN,
        },
      ]);

      const result = await tradeService.matchTopOrders('BTC_USD');

      expect(result).toBeInstanceOf(Trade);
      expect(tradeRepository.storeTrade).toHaveBeenCalledTimes(1);

      expect(orderService.fillOrder).toHaveBeenCalledWith('bid1');
      expect(orderService.fillOrder).toHaveBeenCalledWith('ask1');
    });

    test('should partially fill bid order when ask order is smaller', async () => {
      orderService.getTopBids.mockResolvedValueOnce([
        {
          orderId: 'bid1',
          price: 50000,
          quantity: 3,
          status: TradeStatus.OPEN,
        },
      ]);
      orderService.getTopAsks.mockResolvedValueOnce([
        {
          orderId: 'ask1',
          price: 50000,
          quantity: 1,
          status: TradeStatus.OPEN,
        },
      ]);

      const result = await tradeService.matchTopOrders('BTC_USD');

      expect(result).toBeInstanceOf(Trade);
      expect(orderService.fillOrder).toHaveBeenCalledWith('ask1');
      expect(orderService.updateOrder).toHaveBeenCalledWith('bid1', {
        quantity: 2,
      });
    });
  });

  describe('getRecentTrades', () => {
    test('should fetch recent trades from the repository', async () => {
      tradeRepository.getRecentTrades.mockResolvedValueOnce([
        { tradeId: 'trade1', pair: 'BTC_USD', price: 48000, quantity: 1 },
      ]);

      const result = await tradeService.getRecentTrades('BTC_USD', 5);

      expect(result).toEqual([
        { tradeId: 'trade1', pair: 'BTC_USD', price: 48000, quantity: 1 },
      ]);
      expect(tradeRepository.getRecentTrades).toHaveBeenCalledWith(
        'BTC_USD',
        5,
      );
    });

    test('should default to a limit of 10 when no limit is provided', async () => {
      tradeRepository.getRecentTrades.mockResolvedValueOnce([
        { tradeId: 'trade1', pair: 'BTC_USD', price: 48000, quantity: 1 },
      ]);

      const result = await tradeService.getRecentTrades('BTC_USD');

      expect(result).toEqual([
        { tradeId: 'trade1', pair: 'BTC_USD', price: 48000, quantity: 1 },
      ]);
      expect(tradeRepository.getRecentTrades).toHaveBeenCalledWith(
        'BTC_USD',
        10,
      );
    });
  });
});
