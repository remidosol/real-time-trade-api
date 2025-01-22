import { SupportedPairs, TradeStatus } from '../../core/globalConstants.js';

export class Order {
  /**
   * @type {string}
   */
  orderId;

  /**
   * @type {keyof SupportedPairs}
   */
  pair;

  /**
   * @type {number}
   */
  price;

  /**
   * @type {number}
   */
  quantity;

  /**
   * @type {string}
   */
  side;

  /**
   * @type {keyof TradeStatus}
   */
  status;

  /**
   *
   * @param {{orderId: string; pair: keyof SupportedPairs; price: number; side: string; quantity: number; status: keyof TradeStatus}} orderProps
   */
  constructor({ orderId, pair, price, quantity, side, status }) {
    this.orderId = orderId;
    this.pair = pair;
    this.price = price;
    this.quantity = quantity;
    this.side = side;
    this.status = status; // open, filled, cancelled
  }
}
