import { Namespace, Socket } from 'socket.io';
import {
  ErrorEventNames,
  EventSchemas,
  IncomingEventNames,
  isValidationSuccess,
  OutgoingEventNames,
} from '../core/events/index.js';
import logger from '../core/logger/logger.js';
import tradeService from './tradeService.js';
import { socketDtoMiddleware } from '../core/middlewares/validateSocket.js';

export class TradeGateway {
  #nameSpace;
  #tradeService;

  /**
   * @constructor
   * @param {Namespace} nameSpace
   */
  constructor(nameSpace) {
    this.#nameSpace = nameSpace;
    this.#tradeService = tradeService;

    this.#nameSpace.use(socketDtoMiddleware(EventSchemas));

    this.#nameSpace.on('connection', (socket) => {
      logger.debug(`Client (${socket.id}) connected.`);

      // 1) matchTopOrders => tries matching top bid & ask for a pair
      socket.on(IncomingEventNames.MATCH_TOP_ORDERS, async (data) =>
        this.handleMatchTopOrders(socket, data),
      );

      // 4) getRecentTrades => fetch last N trades
      socket.on(IncomingEventNames.GET_RECENT_TRADES, async (data) =>
        this.handleGetRecentTrades(socket, data),
      );

      socket.on('disconnect', () => {
        logger.debug(`Client (${socket.id}) disconnected.`);
      });
    });
  }

  /**
   * To handle `MATCH_TOP_ORDERS` event
   *
   * @param {Socket} socket
   * @param {{ pair: keyof SupportedPairs; limit: number|undefined }} data
   * @returns
   */
  async handleMatchTopOrders(socket, data) {
    if (!isValidationSuccess(IncomingEventNames.MATCH_TOP_ORDERS, data)) {
      return;
    }

    try {
      const { pair } = data;
      const trade = await this.#tradeService.matchTopOrders(pair);

      if (!trade) {
        //no match
        return socket.emit(OutgoingEventNames.NO_TRADE, {
          pair,
          message: 'No matching orders',
        });
      }

      // Send the trade info back to the requester
      socket.emit(OutgoingEventNames.TRADE_EXECUTED, trade);

      // Broadcast to all subscribers of that pair
      this.#nameSpace.to(pair).emit(OutgoingEventNames.TRADE_UPDATE, {
        event: OutgoingEventNames.TRADE_EXECUTED,
        trade,
      });
    } catch (err) {
      logger.error('[TradeGateway] matchTopOrders error:', err);
      return socket.emit(ErrorEventNames.TRADE_ERROR, { message: err.message });
    }
  }

  /**
   * To handle `MATCH_TOP_ORDERS` event
   *
   * @param {Socket} socket
   * @param {{ pair: keyof SupportedPairs; limit: number|undefined }} data
   * @returns
   */
  async handleGetRecentTrades(socket, data) {
    if (!isValidationSuccess(IncomingEventNames.GET_RECENT_TRADES, data)) {
      return;
    }

    try {
      const { pair, limit } = data;
      const trades = await this.#tradeService.getRecentTrades(pair, limit);

      socket.emit(OutgoingEventNames.RECENT_TRADES, { pair, trades });
    } catch (err) {
      logger.error('[TradeGateway] getRecentTrades error:', err);
      return socket.emit(ErrorEventNames.TRADE_ERROR, { message: err.message });
    }
  }
}
