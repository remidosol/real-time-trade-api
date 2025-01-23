import { v4 as uuidv4 } from 'uuid';
import { orderRepository } from '../repositories/OrderRepository.js';
import { Order } from '../models/index.js';
import { SupportedPairs } from '../../../core/globalConstants.js';
import { TradeStatus } from '../../trade/index.js';
import logger from '../../../core/logger/Logger.js';

class OrderService {
  #orderRepository;

  constructor() {
    this.#orderRepository = orderRepository;
  }

  /**
   * Creates a new order with a generated UUID, then stores it via the repository.
   *
   * @param {Object} data - { pair, price, quantity, side }
   * @returns {Promise<Order>} the newly created Order object
   */
  async createOrder(data) {
    try {
      // 1) Generate an order ID
      const orderId = uuidv4();

      // 2) Instantiate the domain entity
      const order = new Order({
        orderId,
        pair: data.pair,
        price: data.price,
        quantity: data.quantity,
        side: data.side,
      });

      // 3) Save to repository
      await this.#orderRepository.addOrder(order);

      return order;
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }

  /**
   * Retrieve an order by its ID
   *
   * @param {string} orderId
   * @returns {Promise<Order|null>}
   */
  async getOrder(orderId) {
    return this.#orderRepository.getOrder(orderId);
  }

  /**
   * Cancel an order by ID
   * - Mark its status as CANCELLED
   * - Remove it from the order book if needed
   *
   * @param {string} orderId
   *
   * @returns {Promise<Order | null>} the updated order, or null if not found
   */
  async cancelOrder(orderId) {
    try {
      const canceledOrder = await this.#orderRepository.setOrderStatus(
        orderId,
        TradeStatus.CANCELLED,
      );

      return canceledOrder;
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }

  /**
   * Fill (execute) an order by ID
   *
   * @param {string} orderId
   *
   * @returns {Promise<Order | null>} the updated order, or null if not found
   */
  async fillOrder(orderId) {
    try {
      const filledOrder = await this.#orderRepository.setOrderStatus(
        orderId,
        TradeStatus.FILLED,
      );

      return filledOrder;
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }

  /**
   * Update order fields (price, quantity, etc.)
   * - If price changes, the repository re-inserts the order in the correct sorted set
   * - Partial updates are allowed
   *
   * @param {string} orderId
   * @param {Object} partialUpdate - e.g. { price: 21000, quantity: 2 }
   *
   * @returns {Promise<Order | null>}
   */
  async updateOrder(orderId, partialUpdate) {
    return this.#orderRepository.updateOrder(orderId, partialUpdate);
  }

  /**
   * Get top N bids (highest buy orders) for a trading pair
   *
   * @param {keyof SupportedPairs} pair
   * @param {number | undefined} limit - how many top orders to retrieve
   *
   * @returns {Promise<Order[]>}
   */
  async getTopBids(pair, limit = 5) {
    return this.#orderRepository.getTopBids(pair, limit);
  }

  /**
   * Get top N asks (lowest sell orders) for a trading pair
   *
   * @param {keyof SupportedPairs} pair
   * @param {number | undefined} limit - how many top orders to retrieve
   *
   * @returns {Promise<Order[]>}
   */
  async getTopAsks(pair, limit = 5) {
    return this.#orderRepository.getTopAsks(pair, limit);
  }

  /**
   * (Optional) Clear entire orderbook for a pair
   * WARNING: destructive operation
   */
  async clearOrderBook(pair) {
    await this.#orderRepository.clearOrderBook(pair);
  }
}

export const orderService = new OrderService();
