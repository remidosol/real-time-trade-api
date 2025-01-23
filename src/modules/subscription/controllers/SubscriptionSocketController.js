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

    if (await this.#isSubscribed(socket, data.pair)) {
      socket.emit(
        ...EmitResponse.Success({
          eventEmit: ErrorEventNames.SUBSCRIPTION_ERROR,
          payloadEventKey: ErrorEventNames.SUBSCRIPTION_ERROR,
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
      ...EmitResponse.Success({
        eventEmit: OutgoingEventNames.SUBSCRIBED,
        payloadEventKey: OutgoingEventNames.SUBSCRIBED,
        message: `Subscribing to ${data.pair} pair is successful`,
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

    if (!(await this.#isSubscribed(socket, data.pair))) {
      socket.emit(
        ...EmitResponse.Error({
          eventEmit: ErrorEventNames.SUBSCRIPTION_ERROR,
          payloadEventKey: ErrorEventNames.SUBSCRIPTION_ERROR,
          message: `You are not subscribed to ${data.pair}`,
        }),
      );
      return;
    }

    await socket.leave(data.pair);

    logger.info(
      `[SubscriptionSocketController] Socket ${socket.id} left room: ${data.pair}`,
    );

    socket.emit(
      ...EmitResponse.Success({
        eventEmit: OutgoingEventNames.UNSUBSCRIBED,
        payloadEventKey: OutgoingEventNames.UNSUBSCRIBED,
        message: `Unsubscribing to ${data.pair} pair is successful`,
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
      const limit = data.limit || 5;

      const bidsAsksOfSubscribedPairs = {};

      const subscribedPairs = await this.#getSubscribedPairs(socket);

      for (const [pair] of subscribedPairs.entries()) {
        const [bids, asks] = await Promise.all([
          this.#orderService.getTopBids(pair, limit),
          this.#orderService.getTopAsks(pair, limit),
        ]);

        bidsAsksOfSubscribedPairs[pair] = { bids, asks };
      }

      // Respond to the requester
      socket.emit(
        ...EmitResponse.Success({
          eventEmit: OutgoingEventNames.TOP_ORDER_BOOK,
          payloadEventKey: OutgoingEventNames.TOP_ORDER_BOOK,
          data: { ...bidsAsksOfSubscribedPairs },
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
      ...EmitResponse.Error({
        eventEmit: ErrorEventNames.GATEWAY_ERROR,
        payloadEventKey: ErrorEventNames.GATEWAY_ERROR,
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
  async #getSubscribedPairs(socket) {
    const subscribedPairs = new Set();

    for (const [key, _val] of socket.rooms.entries()) {
      if (SupportedPairs[key]) subscribedPairs.add(key);
    }

    return subscribedPairs;
  }

  /**
   * To get subscribed order books
   *
   * @param {Socket} socket
   *
   * @returns {Promise<Set<keyof SupportedPairs>>}
   */
  async #isSubscribed(socket, pair) {
    const subscribedPairs = await this.#getSubscribedPairs(socket);

    return subscribedPairs.has(pair);
  }
}
