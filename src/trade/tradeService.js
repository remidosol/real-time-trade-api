import { v4 as uuidv4 } from 'uuid';
import { tradeRepository } from './tradeRepository.js';
import { Trade } from './models/tradeModel.js';
import { orderService } from '../order/index.js';

class TradeService {
  #tradeRepository;
  #orderService;

  constructor() {
    this.#tradeRepository = tradeRepository;
    this.#orderService = orderService;
  }
  /**
   * Attempt to match the top buy and sell order for a pair.
   * Returns a Trade object if successful, or null if no match.
   */
  async matchTopOrders(pair) {
    // 1) get top bid + ask
    const [bids, asks] = await Promise.all([
      this.#orderService.getTopBids(pair, 1),
      this.#orderService.getTopAsks(pair, 1),
    ]);

    const topBid = bids[0];
    const topAsk = asks[0];

    if (!topBid || !topAsk) {
      //No orders to match
      return null;
    }

    // 2) Check if bid.price >= ask.price => match
    if (topBid.price < topAsk.price) {
      // No match
      return null;
    }

    // For simplicity, we assume a full fill of whichever side is smaller quantity
    const quantity = Math.min(topBid.quantity, topAsk.quantity);
    const price = (topBid.price + topAsk.price) / 2; // or pick topAsk.price or topBid.price

    // 3) Create a Trade
    const trade = new Trade({
      tradeId: uuidv4(),
      pair,
      buyOrderId: topBid.orderId,
      sellOrderId: topAsk.orderId,
      quantity,
      price,
      timestamp: Date.now(),
    });

    // 4) Store trade
    await this.#tradeRepository.storeTrade(trade);

    // 5) Update order quantities & statuses
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
    return tradeRepository.getRecentTrades(pair, limit);
  }
}

const tradeService = new TradeService();

export default tradeService;
