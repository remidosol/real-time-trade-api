import { Server, Socket } from 'socket.io';
import {
  ErrorEventNames,
  EventSchemas,
  IncomingEventNames,
  isValidationSuccess,
  OutgoingEventNames,
} from '../../events/index.js';
import logger from '../../../core/logger/Logger.js';
import { tradeService } from '../services/TradeService.js';
import { socketDtoMiddleware } from '../../../core/middlewares/validateSocket.js';
import { EmitResponse } from '../../../core/responses/EmitResponse.js';

// let tradeService;

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

    // this.getTradeService().then((_tradeService) => {
    //   // console.log(_tradeService);
    //   this.#tradeService = _tradeService;
    // });

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
   * Lazy-load TradeService to prevent circular dependency
   */
  // async getTradeService() {
  //   if (!tradeService) {
  //     tradeService = (await import('../services/TradeService.js')).tradeService;
  //   }

  //   return tradeService;
  // }

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
        return socket.emit(
          ...EmitResponse.Success({
            eventEmit: OutgoingEventNames.NO_TRADE,
            payloadEventKey: OutgoingEventNames.NO_TRADE,
            message: 'No matching orders',
            data: pair,
          }),
        );
      }

      // Emit the trade to the client
      socket.emit(
        ...EmitResponse.Success({
          eventEmit: OutgoingEventNames.TRADE_EXECUTED,
          payloadEventKey: OutgoingEventNames.TRADE_EXECUTED,
          message: 'Trade has been executed',
          data: trade,
        }),
      );

      // Broadcast to all subscribers of that pair
      this.#io
        .of('/subscription')
        .to(pair)
        .emit(
          ...EmitResponse.Success({
            eventEmit: OutgoingEventNames.TRADE_UPDATE,
            payloadEventKey: OutgoingEventNames.TRADE_EXECUTED,
            message: `A trade has been executed for the pair ${pair}`,
            data: trade,
          }),
        );
    } catch (error) {
      this.handleError(socket, {
        ...error,
        error,
        message: error.message,
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

      socket.emit(
        ...EmitResponse.Success({
          eventEmit: OutgoingEventNames.RECENT_TRADES,
          payloadEventKey: OutgoingEventNames.RECENT_TRADES,
          data: { pair, trades },
        }),
      );
    } catch (error) {
      this.handleError(socket, {
        ...error,
        error,
        message: error.message,
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
    logger.error({ ...error, context: '[TradeSocketController]' });
    return socket.emit(
      ...EmitResponse.Error({
        eventEmit: ErrorEventNames.TRADE_ERROR,
        payloadEventKey: ErrorEventNames.TRADE_ERROR,
        message: error.message || 'An error occurred',
        error,
      }),
    );
  }
}
