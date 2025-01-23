import { Server, Socket } from 'socket.io';
import {
  ErrorEventNames,
  EventSchemas,
  IncomingEventNames,
  isValidationSuccess,
  OutgoingEventNames,
} from '../../events/index.js';
import { SupportedPairs } from '../../../core/globalConstants.js';
import logger from '../../../core/logger/Logger.js';
import { orderService } from '../../order/index.js';
import { socketDtoMiddleware } from '../../../core/middlewares/validateSocket.js';
import { EmitResponse } from '../../../core/responses/EmitResponse.js';

export class SubscriptionSocketController {
  #io;
  #nameSpace;
  #orderService;

  /**
   * @constructor
   * @param {Server} io
   */
  constructor(io) {
    this.#io = io;
    this.#orderService = orderService;

    this.#nameSpace = this.#io.of('/subscription');

    this.#nameSpace.use(socketDtoMiddleware(EventSchemas));

    this.#nameSpace.on('connection', (socket) => {
      logger.debug(`Client (${socket.id}) connected.`);

      socket.on(IncomingEventNames.SUBSCRIBE_PAIR, (data) =>
        this.handleSubscribePair(socket, data),
      );

      socket.on(IncomingEventNames.UNSUBSCRIBE_PAIR, async (data) =>
        this.handleUnsubscribePair(socket, data),
      );

      socket.on(IncomingEventNames.GET_TOP_ORDER_BOOK, async (data) =>
        this.handleGetTopOrderBook(socket, data),
      );

      socket.on('disconnect', () => {
        logger.debug(`Client (${socket.id}) disconnected.`);
      });
    });
  }

  /**
   * Subscribe to a specific trading pair.
   *
   * @param {Socket} socket
   * @param {{ pair: keyof SupportedPairs }} data { pair }
   */
  async handleSubscribePair(socket, data) {
    if (!isValidationSuccess(IncomingEventNames.SUBSCRIBE_PAIR, data)) {
      return;
    }

    const subscribedPairs = await this.getSubscribedPairs(socket);

    if (subscribedPairs.has(data.pair)) {
      socket.emit(
        ErrorEventNames.SUBSCRIPTION_ERROR,
        EmitResponse.Error({
          event: ErrorEventNames.SUBSCRIPTION_ERROR,
          message: `You already subscribed to ${data.pair}`,
        }),
      );
      return;
    }

    await socket.join(data.pair);

    logger.info(
      `[SubscriptionSocketController] Socket ${socket.id} joined room: ${data.pair}`,
    );

    socket.emit(
      OutgoingEventNames.SUBSCRIBED,
      EmitResponse.Success({
        event: ErrorEventNames.SUBSCRIBED,
        message: `Subscribing to ${data.pair} pair is successfull`,
      }),
    );
  }

  /**
   * Unsubscribe from a trading pair.
   *
   * @param {Socket} socket
   * @param {{ pair: keyof SupportedPairs }} data { pair }
   */
  async handleUnsubscribePair(socket, data) {
    if (!isValidationSuccess(IncomingEventNames.UNSUBSCRIBE_PAIR, data)) {
      return;
    }

    const subscribedPairs = await this.getSubscribedPairs(socket);

    if (!subscribedPairs.has(data.pair)) {
      socket.emit(
        ErrorEventNames.SUBSCRIPTION_ERROR,
        EmitResponse.Error({
          event: ErrorEventNames.SUBSCRIPTION_ERROR,
          message: `You already did not subscribed to ${data.pair}`,
        }),
      );
      return;
    }

    await socket.leave(data.pair);

    logger.info(
      `[SubscriptionSocketController] Socket ${socket.id} left room: ${data.pair}`,
    );

    socket.emit(
      OutgoingEventNames.UNSUBSCRIBED,
      EmitResponse.Success({
        event: ErrorEventNames.UNSUBSCRIBED,
        message: `Unsubscribing to ${data.pair} pair is successfull`,
      }),
    );
  }

  /**
   * Let a client request the top N bids/asks for a pair.
   *
   * @param {Socket} socket
   * @param {Object} data { pair, limit } (limit is optional)
   */
  async handleGetTopOrderBook(socket, data) {
    if (!isValidationSuccess(IncomingEventNames.GET_TOP_ORDER_BOOK, data)) {
      return;
    }

    try {
      const pair = data.pair;
      const limit = data.limit || 5;

      // Fetch top bids, asks
      const [bids, asks] = await Promise.all([
        this.#orderService.getTopBids(pair, limit),
        this.#orderService.getTopAsks(pair, limit),
      ]);

      // Respond to the requester
      socket.emit(
        OutgoingEventNames.TOP_ORDER_BOOK,
        EmitResponse.Success({
          event: ErrorEventNames.UNSUBSCRIBED,
          message: `Unsubscribing to ${data.pair} pair is successfull`,
          data: {
            pair,
            bids,
            asks,
          },
        }),
      );
    } catch (error) {
      this.handleError(socket, {
        ...error,
        message: 'getTopOrderBook error',
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
    logger.error('An error occurred', {
      message: error.message,
      error,
      context: '[SubscriptionSocketController]',
    });
    return socket.emit(
      ErrorEventNames.GATEWAY_ERROR,
      EmitResponse.Error({
        event: ErrorEventNames.GATEWAY_ERROR,
        message: error.message || 'An error occurred',
        error,
      }),
    );
  }

  /**
   * To get subscribed order books
   *
   * @param {Socket} socket
   *
   * @returns {Promise<Set<keyof SupportedPairs>>}
   */
  async getSubscribedPairs(socket) {
    const subscribedPairs = new Set();

    for (const [key, _val] of socket.rooms.entries()) {
      if (SupportedPairs[key]) subscribedPairs.add(key);
    }

    return subscribedPairs;
  }
}
