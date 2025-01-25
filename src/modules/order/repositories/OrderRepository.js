import redisClient from '../../../config/RedisClient.js';
import { SupportedPairs } from '../../../core/globalConstants.js';
import logger from '../../../core/logger/Logger.js';
import { TradeStatus, tradeRepository } from '../../trade/index.js';
import { Order } from '../models/index.js';
import { OrderType, Sides } from '../orderConstants.js';

export class OrderRepository {
  #redis;
  #tradeRepository;

  constructor(_redis, _tradeRepository) {
    this.#redis = _redis ?? redisClient.getClient();
    this.#tradeRepository = _tradeRepository ?? tradeRepository;
  }

  /**
   * Save the entire order in a Redis hash.
   *
   * Key: `order:{orderId}`
   *
   * @param {Order} order
   */
  async saveOrder(order) {
    const orderKey = `order:${order.orderId}`;

    try {
      await this.#redis.hset(orderKey, {
        orderId: order.orderId,
        orderType: order.orderType,
        pair: order.pair,
        price: order.price,
        side: order.side,
        quantity: order.quantity,
        status: order.status,
      });
    } catch (error) {
      logger.error({
        ...error,
        context: '[OrderRepository]',
      });
      throw error;
    }
  }

  /**
   * Save the entire order in a Redis hash.
   *
   * Key: `order:{orderId}`
   *
   * @param {Order} order
   */
  async deleteOrder(order) {
    const orderKey = `order:${order.orderId}`;

    try {
      await this.#redis.hdel(orderKey);
    } catch (error) {
      logger.error({
        ...error,
        context: '[OrderRepository]',
      });
      throw error;
    }
  }

  /**
   * Fetch an order has from Redis and build an Order instance
   *
   * @param {string} orderId
   * @returns {Promise<Order|null>} Order instance
   */
  async getOrder(orderId) {
    const orderKey = `order:${orderId}`;

    try {
      const data = await this.#redis.hgetall(orderKey);

      if (!data || !data.orderId) {
        return null;
      }

      const order = new Order({
        orderId: data.orderId,
        orderType: data.orderType,
        pair: data.pair,
        price: parseFloat(data.price),
        quantity: parseFloat(data.quantity),
        side: data.side,
        status: data.status,
      });

      return order;
    } catch (error) {
      logger.error({
        ...error,
        context: '[OrderRepository]',
      });
      throw error;
    }
  }

  /**
   * Add an order to order book (sorted sets)
   * - Bids: store with negative price => highest price is top
   * - Asks: store with positive price => lowest price is top
   *
   * @param {Order} order
   */
  async addOrder(order) {
    try {
      await this.saveOrder(order);

      const pair = order.pair;

      let priceToUse = order.price; // Use provided price for LIMIT orders

      if (order.orderType === OrderType.MARKET) {
        if (order.side === Sides.BUY) {
          // Get lowest ask price
          const topAsk = await this.getTopAsks(pair, 1);

          if (topAsk.length > 0) {
            priceToUse = topAsk[0].price;
          } else {
            // No asks → Use last trade price
            const lastTrade = await this.#tradeRepository.getRecentTrades(
              pair,
              1,
            );

            priceToUse = lastTrade.length > 0 ? lastTrade[0].price : 99999999;
          }
        } else if (order.side === Sides.SELL) {
          const topBid = await this.getTopBids(pair, 1);

          if (topBid.length > 0) {
            priceToUse = topBid[0].price;
          } else {
            // No bids → Use last trade price
            const lastTrade = await this.#tradeRepository.getRecentTrades(
              pair,
              1,
            );
            priceToUse = lastTrade.length > 0 ? lastTrade[0].price : 0.0001;
          }
        }
      }

      if (order.side === Sides.BUY) {
        await this.#redis.zadd(
          `orderbook:${pair}:bids`,
          -priceToUse,
          order.orderId,
        );
      } else if (order.side === Sides.SELL) {
        await this.#redis.zadd(
          `orderbook:${pair}:asks`,
          priceToUse,
          order.orderId,
        );
      }
    } catch (error) {
      logger.error({
        ...error,
        context: '[OrderRepository]',
      });
      throw error;
    }
  }

  /**
   * Add an order to order book (sorted sets)
   * - Bids: store with negative price => highest price is top
   * - Asks: store with positive price => lowest price is top
   *
   * @param {Order} order
   */
  async removeOrder(order) {
    const pair = order.pair;

    try {
      if (order.side === Sides.BUY) {
        await this.#redis.zrem(`orderbook:${pair}:bids`, order.orderId);
      } else if (order.side === Sides.SELL) {
        await this.#redis.zrem(`orderbook:${pair}:asks`, order.orderId);
      }

      //   await this.deleteOrder(order);
    } catch (error) {
      logger.error({
        ...error,
        context: '[OrderRepository]',
      });
      throw error;
    }
  }

  /**
   * Update an order
   *
   * @param {string} orderId
   * @param {Order} fieldsToUpdate
   *
   * @returns {Promise<Order|null>} updated order
   */
  async updateOrder(orderId, fieldsToUpdate) {
    try {
      const existingOrder = await this.getOrder(orderId);

      if (!existingOrder) {
        return null;
      }

      existingOrder.status = fieldsToUpdate.status ?? existingOrder.status;
      existingOrder.quantity =
        fieldsToUpdate.quantity ?? existingOrder.quantity;

      if (fieldsToUpdate.price !== undefined) {
        // Price changed => remove from old sorted set + re-add with new price
        await this.#_updateOrderPrice(existingOrder, fieldsToUpdate.price);
      }

      existingOrder.price = fieldsToUpdate.price ?? existingOrder.price;

      await this.saveOrder(existingOrder);

      return existingOrder;
    } catch (error) {
      logger.error({
        ...error,
        context: '[OrderRepository]',
      });
      throw error;
    }
  }

  /**
   * Helper to update an order's price in the sorted set.
   * We remove it with the old price, then re-insert with the new price.
   * Keep side/pair the same.
   *
   * @param {Order} order
   * @param {number} newPrice
   */
  async #_updateOrderPrice(order, newPrice) {
    try {
      const pair = order.pair;

      const multi = this.#redis.multi();

      if (order.side === Sides.BUY) {
        multi.zrem(`orderbook:${pair}:bids`, order.orderId);
      } else {
        multi.zrem(`orderbook:${pair}:asks`, order.orderId);
      }

      order.price = newPrice;

      const score = Math.abs(newPrice);

      if (order.side === Sides.BUY) {
        multi.zadd(`orderbook:${pair}:bids`, -score, order.orderId);
      } else {
        multi.zadd(`orderbook:${pair}:asks`, score, order.orderId);
      }

      await multi.exec();
    } catch (error) {
      logger.error({
        ...error,
        context: '[OrderRepository]',
      });
      throw error;
    }
  }

  /**
   * Mark an order as "filled" or "cancelled" in the hash.
   * You could also remove it from the sorted set if needed.
   *
   * @param {string} orderId
   * @param {keyof TradeStatus} status
   *
   * @returns {Promise<Order|null>}
   */
  async setOrderStatus(orderId, status) {
    try {
      const order = await this.getOrder(orderId);

      if (!order) return null;

      order.status = status;

      // If it's canceled or filled, maybe remove from the order book
      // order will be removed from sorted set, not from hash
      if (status === TradeStatus.CANCELLED || status === TradeStatus.FILLED) {
        await this.removeOrder(order);
      }

      await this.saveOrder(order);

      return order;
    } catch (error) {
      logger.error({
        ...error,
        context: '[OrderRepository]',
      });
      throw error;
    }
  }

  /**
   * Get top N bids (highest price) for a pair using negative scores.
   *
   * @param {keyof SupportedPairs} pair
   * @param {number | undefined} limit
   *
   * @returns {Promise<Order[]>} parsed output
   */
  async getTopBids(pair, limit = 5) {
    // zrange with REV option to get top in descending order
    const results = await this.#redis.zrange(
      `orderbook:${pair}:bids`,
      0,
      limit - 1,
      'WITHSCORES',
      'REV',
    );

    // Results is an array: [orderId, score, orderId, score, ...]
    return this.#_parseZRangeResults(results, true);
  }

  /**
   * Get top N asks (lowest price) for a pair using positive scores (ascending).
   *
   * @param {keyof SupportedPairs} pair
   * @param {number | undefined} limit
   *
   * @returns {Promise<Order[]>} parsed output
   */
  async getTopAsks(pair, limit = 5) {
    const results = await this.#redis.zrange(
      `orderbook:${pair}:asks`,
      0,
      limit - 1,
      'WITHSCORES',
    );

    return this.#_parseZRangeResults(results, false);
  }

  /**
   * Helper to parse zrange results into array of { orderId, price } objects.
   *
   * @param {string[]} results
   * @param {boolean} isBid
   *
   * @returns {Promise<Order[]>} parsed output
   */
  async #_parseZRangeResults(results, isBid) {
    const output = [];

    // console.log('results:', results);

    for (let i = 0; i < results.length; i += 2) {
      const orderId = results[i];
      const scoreStr = results[i + 1];
      const rawScore = parseFloat(scoreStr);
      const price = isBid ? -rawScore : rawScore;

      const order = await this.getOrder(orderId);

      if (!order) {
        throw new Error('There should be the Order!');
      }

      order.price = price; // ensure correct price

      output.push(order);
    }

    // console.log('output:', output);

    return output;
  }

  /**
   * Clear the entire order book for a pair (both bids & asks).
   * ! WARNING: destructive operation.
   */
  async clearOrderBook(pair) {
    this.#redis.del(`orderbook:${pair}:bids`);
    this.#redis.del(`orderbook:${pair}:asks`);
  }
}

export const orderRepository = new OrderRepository();
