import { TradeRepository } from '../repositories/TradeRepository.js';
import { Trade } from '../models/Trade.js';
import {
  getCleanUp,
  getRedisMock,
  setupMocksAndSpies,
} from '../../../../tests/testServerSetup.js';
import {
  describe,
  beforeAll,
  afterAll,
  expect,
  beforeEach,
  afterEach,
} from '@jest/globals';
import { SupportedPairs } from '../../../core/globalConstants.js';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-trade-id'),
}));

jest.mock('ioredis', () => require('ioredis-mock'));

describe('TradeRepository', () => {
  let cleanUp;

  /**
   * @type {TradeRepository}
   */
  let tradeRepository;

  /**
   * @type {Redis}
   */
  let mockRedis;

  beforeAll(async () => {
    mockRedis = getRedisMock();
    tradeRepository = setupMocksAndSpies('repository', mockRedis).mocks
      .tradeRepository;

    cleanUp = getCleanUp({ mockRedis });
  }, 10000);

  afterEach(async () => {
    jest.clearAllMocks();
    await mockRedis.flushall();
  });

  afterAll(() => {
    cleanUp();
  });

  test('should store a new trade and retrieve it', async () => {
    const tradeId = 'mocked-trade-id';

    const trade = new Trade({
      tradeId,
      pair: SupportedPairs.BTC_USD,
      buyOrderId: 'buy456',
      sellOrderId: 'sell789',
      quantity: 2.5,
      price: 45000,
      timestamp: Date.now(),
    });

    await tradeRepository.storeTrade(trade);

    const retrievedTrade = await tradeRepository.getTrade(tradeId);

    expect(retrievedTrade).toEqual(trade);
  });

  test('should return null when retrieving a non-existing trade', async () => {
    const retrievedTrade = await tradeRepository.getTrade('non_existing_trade');
    expect(retrievedTrade).toBeNull();
  });

  test('should retrieve recent trades for a pair', async () => {
    const trade1 = new Trade({
      tradeId: 'mocked-trade-id',
      pair: SupportedPairs.ETH_USD,
      buyOrderId: 'buyA',
      sellOrderId: 'sellA',
      quantity: 1.2,
      price: 3200,
      timestamp: Date.now(),
    });

    const trade2 = new Trade({
      tradeId: 'mocked-trade-id',
      pair: SupportedPairs.ETH_USD,
      buyOrderId: 'buyB',
      sellOrderId: 'sellB',
      quantity: 3.4,
      price: 3150,
      timestamp: Date.now() - 1000, // Earlier trade
    });

    await tradeRepository.storeTrade(trade1);
    await tradeRepository.storeTrade(trade2);

    const recentTrades = await tradeRepository.getRecentTrades(
      SupportedPairs.ETH_USD,
      2,
    );

    expect(recentTrades).toHaveLength(2);
    expect(recentTrades[0]).toEqual(trade1); // Latest trade should be first
    expect(recentTrades[1]).toEqual(trade2);
  });

  test('should return an empty array when no recent trades exist', async () => {
    const recentTrades = await tradeRepository.getRecentTrades(
      SupportedPairs.LTC_USD,
      5,
    );
    expect(recentTrades).toEqual([]);
  });
});
