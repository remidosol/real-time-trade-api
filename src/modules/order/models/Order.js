import { SupportedPairs } from '../../../core/globalConstants.js';
import { TradeStatus } from '../../trade/index.js';
import { OrderType } from '../orderConstants.js';

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
   * @type {keyof OrderType}
   */
  orderType;

  /**
   *
   * @param {Object} orderProps
   * @param {string} orderProps.orderId
   * @param {keyof SupportedPairs} orderProps.pair
   * @param {number} orderProps.price
   * @param {number} orderProps.quantity
   * @param {keyof Sides} orderProps.side
   * @param {keyof TradeStatus} orderProps.status
   * @param {keyof OrderType} orderProps.orderType
   */
  constructor({ orderId, pair, price, quantity, side, status, orderType }) {
    this.orderId = orderId;
    this.pair = pair;
    this.price = price;
    this.quantity = quantity;
    this.side = side;
    this.status = status; // OPEN, FILLED, CANCELLED
    this.orderType = orderType; // LIMIT, MARKET
  }
}
