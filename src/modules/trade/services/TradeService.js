import { v4 as uuidv4 } from 'uuid';
import {
  TradeRepository,
  tradeRepository,
} from '../repositories/TradeRepository.js';
import { Trade } from '../models/Trade.js';
import {
  OrderService,
  orderService,
} from '../../order/services/OrderService.js';
import { SupportedPairs } from '../../../core/globalConstants.js';
import { TradeStatus } from '../tradeConstants.js';

export class TradeService {
  /**
   * @type {TradeRepository}
   */
  #tradeRepository;

  /**
   * @type {OrderService}
   */
  #orderService;

  constructor(_tradeRepository, _orderService) {
    this.#tradeRepository = _tradeRepository ?? tradeRepository;
    this.#orderService = _orderService ?? orderService;
  }

  /**
   * Attempt to match the top buy and sell order for a pair.
   * Returns a Trade object if successful, or null if no match.
   *
   * @param {keyof SupportedPairs} pair
   */
  async matchTopOrders(pair) {
    console.log('Matching top orders for', pair);

    const [bids, asks] = await Promise.all([
      this.#orderService.getTopBids(pair, 1),
      this.#orderService.getTopAsks(pair, 1),
    ]);

    const topBid = bids[0];
    const topAsk = asks[0];

    if (
      !topBid ||
      !topAsk ||
      topBid.price < topAsk.price ||
      topBid.status !== TradeStatus.OPEN ||
      topAsk.status !== TradeStatus.OPEN
    ) {
      return null;
    }

    // For simplicity, we assume a full fill of whichever side is smaller quantity
    const quantity = Math.min(topBid.quantity, topAsk.quantity);
    const price = (topBid.price + topAsk.price) / 2;

    const trade = new Trade({
      tradeId: uuidv4(),
      pair,
      buyOrderId: topBid.orderId,
      sellOrderId: topAsk.orderId,
      quantity,
      price,
      timestamp: Date.now(),
    });

    await this.#tradeRepository.storeTrade(trade);

    const newBidQty = topBid.quantity - quantity;
    const newAskQty = topAsk.quantity - quantity;

    if (newBidQty <= 0) {
      // Mark bid as filled
      await this.#orderService.fillOrder(topBid.orderId);
    } else {
      // Partially filled
      await this.#orderService.updateOrder(topBid.orderId, {
        quantity: newBidQty,
      });
    }

    if (newAskQty <= 0) {
      //Mark ask as filled
      await this.#orderService.fillOrder(topAsk.orderId);
    } else {
      // Partially filled
      await this.#orderService.updateOrder(topAsk.orderId, {
        quantity: newAskQty,
      });
    }

    return trade;
  }

  /**
   * Return recent trades for a pair
   *
   * @param {keyof SupportedPairs} pair
   * @param {number | undefined} limit
   *
   * @returns {Promise<Trade[]>} recent trades
   */
  async getRecentTrades(pair, limit = 10) {
    return this.#tradeRepository.getRecentTrades(pair, limit ?? 10);
  }
}

const tradeService = new TradeService();

export { tradeService };
