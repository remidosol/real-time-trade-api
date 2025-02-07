import redisClient from '../../../config/RedisClient.js';
import { SupportedPairs } from '../../../core/globalConstants.js';
import { Trade } from '../models/Trade.js';
import logger from '../../../core/logger/Logger.js';

export class TradeRepository {
  #redis;

  constructor(_redis) {
    this.#redis = _redis ?? redisClient.getClient();
  }

  /**
   * Store a new trade:
   * - trade hash => trade:{tradeId}
   * - list or sorted set => trades:{pair}
   *
   * @param {Trade} trade
   */
  async storeTrade(trade) {
    try {
      const tradeKey = `trade:${trade.tradeId}`;

      const multi = this.#redis.multi();

      multi.hset(tradeKey, {
        tradeId: trade.tradeId,
        pair: trade.pair,
        buyOrderId: trade.buyOrderId,
        sellOrderId: trade.sellOrderId,
        quantity: String(trade.quantity),
        price: String(trade.price),
        timestamp: String(trade.timestamp),
      });

      // For chronological listing, use timestamp as the score.
      multi.zadd(`trades:${trade.pair}`, trade.timestamp, trade.tradeId);

      await multi.exec();
    } catch (error) {
      logger.error({
        ...error,
        context: '[TradeRepository]',
      });
      throw error;
    }
  }

  /**
   * Retrieve a trade by tradeId
   *
   * @param {string} tradeId
   *
   * @returns {Promise<Trade|null>}
   */
  async getTrade(tradeId) {
    try {
      const tradeKey = `trade:${tradeId}`;

      const data = await this.#redis.hgetall(tradeKey);

      if (!data || !data?.tradeId) return null;

      return new Trade({
        tradeId: data.tradeId,
        pair: data.pair,
        buyOrderId: data.buyOrderId,
        sellOrderId: data.sellOrderId,
        quantity: parseFloat(data.quantity),
        price: parseFloat(data.price),
        timestamp: parseInt(data.timestamp, 10),
      });
    } catch (error) {
      logger.error({
        ...error,
        context: '[TradeRepository]',
      });
      throw error;
    }
  }

  /**
   * Get recent trades for a pair, optionally limiting how many or by time range.
   *e.g. get last 10 trades (ZREVRANGE).
   *
   * @param {keyof SupportedPairs} pair
   * @param {number | undefined} limit
   *
   * @returns {Promise<Trade[]>} recent trades
   */
  async getRecentTrades(pair, limit = 10) {
    const results = await this.#redis.zrevrange(`trades:${pair}`, 0, limit - 1);

    // results is array of tradeIds (most recent first).

    const trades = [];
    for (const tradeId of results) {
      const trade = await this.getTrade(tradeId);

      if (trade) {
        trades.push(trade);
      }
    }

    return trades;
  }
}

export const tradeRepository = new TradeRepository();
