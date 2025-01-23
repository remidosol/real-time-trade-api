export class Trade {
  /**
   * @property {string}
   */
  tradeId;

  /**
   * @property {string}
   */
  pair;

  /**
   * @property {string}
   */
  buyOrderId;

  /**
   * @property {string}
   */
  sellOrderId;

  /**
   * @property {number}
   */
  quantity;

  /**
   * @property {number}
   */
  price;

  /**
   * @property {string | number | Date}
   */
  timestamp;

  /**
   *
   * @param {{tradeId: string; pair: string; buyOrderId: string; sellOrderId: string; quantity: number; price: number; timestamp: string | number | Date}} tradeProps
   */
  constructor({
    tradeId,
    pair,
    buyOrderId,
    sellOrderId,
    quantity,
    price,
    timestamp,
  }) {
    this.tradeId = tradeId;
    this.pair = pair;
    this.buyOrderId = buyOrderId;
    this.sellOrderId = sellOrderId;
    this.quantity = quantity;
    this.price = price;
    this.timestamp = timestamp || Date.now();
  }
}
