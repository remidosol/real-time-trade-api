import { Namespace, Server, Socket } from 'socket.io';
import {
  ErrorEventNames,
  EventSchemas,
  IncomingEventNames,
  isValidationSuccess,
  OutgoingEventNames,
} from '../core/events/index.js';
import { SupportedPairs } from '../core/globalConstants.js';
import logger from '../core/logger/logger.js';
import { orderService } from '../order/index.js';
import { socketDtoMiddleware } from '../core/middlewares/validateSocket.js';

export class SubscriptionGateway {
  #nameSpace;
  #orderService;

  /**
   * @constructor
   * @param {Namespace} nameSpace
   */
  constructor(nameSpace) {
    this.#nameSpace = nameSpace;
    this.#orderService = orderService;

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
      socket.emit(ErrorEventNames.SUBSCRIPTION_ERROR, {
        message: `You already subscribed to ${data.pair}`,
      });
      return;
    }

    await socket.join(data.pair);

    logger.info(
      `[SubscriptionGateway] Socket ${socket.id} joined room: ${data.pair}`,
    );

    socket.emit(OutgoingEventNames.SUBSCRIBED, {
      message: `Subscribing to ${data.pair} pair is successfull`,
    });
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
      socket.emit(ErrorEventNames.SUBSCRIPTION_ERROR, {
        message: `You already did not subscribed to ${data.pair}`,
      });
      return;
    }

    await socket.leave(data.pair);

    logger.info(
      `[SubscriptionGateway] Socket ${socket.id} left room: ${data.pair}`,
    );

    socket.emit(OutgoingEventNames.UNSUBSCRIBED, {
      message: `Unsubscribing to ${data.pair} pair is successfull`,
    });
  }

  /**
   * Let a client request the top N bids/asks for a pair.
   *
   * @param {Socket} socket
   * @param {Object} data { pair, limit } (limit is optional)
   */
  async handleGetTopOrderBook(socket, data) {
    // if (!isValidationSuccess(IncomingEventNames.GET_TOP_ORDER_BOOK, data)) {
    //   return;
    // }

    try {
      const pair = data.pair;
      const limit = data.limit || 5;

      if (!pair) {
        return socket.emit(ErrorEventNames.ORDER_BOOK_ERROR, {
          message: 'pair is required',
        });
      }

      // Fetch top bids, asks
      const [bids, asks] = await Promise.all([
        this.#orderService.getTopBids(pair, limit),
        this.#orderService.getTopAsks(pair, limit),
      ]);

      // Respond to the requester
      socket.emit(OutgoingEventNames.TOP_ORDER_BOOK, {
        pair,
        bids,
        asks,
      });
    } catch (error) {
      this.handleError(socket, error);
    }
  }

  /**
   * A generic error handler for any async operation.
   *
   * @param {Socket} socket
   * @param {object} error
   */
  handleError(socket, error) {
    logger.error('[SubscriptionGateway] Error:', error);
    return socket.emit(ErrorEventNames.GATEWAY_ERROR, {
      message: error.message || 'An error occurred',
    });
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
