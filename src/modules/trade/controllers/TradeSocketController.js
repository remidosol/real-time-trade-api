import { Server, Socket } from 'socket.io';
import {
  ErrorEventNames,
  EventSchemas,
  IncomingEventNames,
  isValidationSuccess,
  OutgoingEventNames,
} from '../../events/index.js';
import logger from '../../../core/logger/Logger.js';
import tradeService from '../services/TradeService.js';
import { socketDtoMiddleware } from '../../../core/middlewares/validateSocket.js';
import { EmitResponse } from '../../../core/responses/EmitResponse.js';

export class TradeSocketController {
  #io;
  #nameSpace;
  #tradeService;

  /**
   * @constructor
   * @param {Server} io
   */
  constructor(io) {
    this.#io = io;
    this.#tradeService = tradeService;

    this.#nameSpace = this.#io.of('/trade');

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

      console.log('trade:', trade);

      if (!trade) {
        //no match
        return socket.emit(
          OutgoingEventNames.NO_TRADE,
          EmitResponse.Success({
            event: ErrorEventNames.NO_TRADE,
            message: 'No matching orders',
            data: pair,
          }),
        );
      }

      // Emit the trade to the client
      socket.emit(
        OutgoingEventNames.TRADE_EXECUTED,
        EmitResponse.Success({
          event: ErrorEventNames.TRADE_EXECUTED,
          message: 'Trade has been executed',
          data: trade,
        }),
      );

      // Broadcast to all subscribers of that pair
      this.#io
        .of('/subscription')
        .to(pair)
        .emit(
          OutgoingEventNames.TRADE_UPDATE,
          EmitResponse.Success({
            event: ErrorEventNames.TRADE_EXECUTED,
            message: `A trade has been executed for the pair ${pair}`,
            data: trade,
          }),
        );
    } catch (err) {
      this.handleError(socket, {
        ...err,
        message: 'matchTopOrders error',
      });
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
      this.handleError(socket, {
        ...err,
        message: 'getRecentTrades error',
      });
    }
  }

  /**
   * A generic error handler for any async operation.
   *
   * @param {Socket} socket
   * @param {object} error
   */
  handleError(socket, error) {
    logger.error('[TradeSocketController] Error:', {
      message: error.message,
      error,
      context: '[TradeSocketController]',
    });
    return socket.emit(
      ErrorEventNames.TRADE_ERROR,
      EmitResponse.Error({
        event: ErrorEventNames.TRADE_ERROR,
        message: error.message || 'An error occurred',
        error,
      }),
    );
  }
}
