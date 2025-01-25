import { v4 as uuidv4 } from 'uuid';
import {
  OrderRepository,
  orderRepository,
} from '../repositories/OrderRepository.js';
import { Order } from '../models/index.js';
import { SupportedPairs } from '../../../core/globalConstants.js';
import { TradeService, TradeStatus } from '../../trade/index.js';
// import { tradeService } from '../../trade/index.js';
import logger from '../../../core/logger/Logger.js';
import { OrderType } from '../orderConstants.js';

// To prevent circular dependency, we'll use a module-level variable
let tradeService;

export class OrderService {
  /**
   * @type {OrderRepository}
   */
  #orderRepository;

  /**
   * @type {TradeService}
   */
  #tradeService;

  constructor(_orderRepository, _tradeService) {
    this.#orderRepository = _orderRepository ?? orderRepository;

    if (_tradeService) {
      this.#tradeService = _tradeService;
    } else {
      this.getTradeService().then((tradeService) => {
        this.#tradeService = tradeService;
      });
    }
  }

  /**
   * Lazy-load TradeService to prevent circular dependency
   */
  async getTradeService() {
    if (!tradeService) {
      tradeService = (await import('../../trade/services/TradeService.js'))
        .tradeService;
    }

    return tradeService;
  }

  /**
   * Creates a new order with a generated UUID, then stores it via the repository.
   *
   * @param {Object} data - { pair, price, quantity, side }
   * @returns {Promise<Order>} the newly created Order object
   */
  async createOrder(data) {
    const { pair, price, quantity, side, orderType } = data;

    try {
      const orderId = uuidv4();

      const order = new Order({
        orderId,
        pair: pair,
        price: price,
        quantity: quantity,
        side: side,
        status: TradeStatus.OPEN,
        orderType: orderType,
      });

      // If it's a MARKET order, attempt immediate execution
      if (data.orderType === OrderType.MARKET) {
        const matchedTrade = await this.#tradeService.matchTopOrders(data.pair);

        if (matchedTrade) {
          order.status = TradeStatus.FILLED;
        }
      }

      // Store LIMIT orders in order book
      if (
        data.orderType === OrderType.LIMIT ||
        order.status !== TradeStatus.FILLED
      ) {
        await this.#orderRepository.addOrder(order);
      }

      return order;
    } catch (error) {
      logger.error({
        ...error,
        context: '[OrderService]',
      });
      throw error;
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
    } catch (error) {
      logger.error({
        ...error,
        context: '[OrderService]',
      });
      throw error;
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
      const order = await this.#orderRepository.getOrder(orderId);

      if (!order || order.status !== TradeStatus.OPEN) {
        return null;
      }

      order.status = TradeStatus.FILLED;

      await this.#orderRepository.setOrderStatus(orderId, TradeStatus.FILLED);

      return order;
    } catch (error) {
      logger.error({
        ...error,
        context: '[OrderService]',
      });
      throw error;
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

const orderService = new OrderService();

export { orderService };
