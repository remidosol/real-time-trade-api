import { Namespace, Server, Socket } from 'socket.io';
import {
  ErrorEventNames,
  EventSchemas,
  IncomingEventNames,
  isValidationSuccess,
  OutgoingEventNames,
} from '../core/events/index.js';
import logger from '../core/logger/logger.js';
import { orderService } from './orderService.js';
import { socketDtoMiddleware } from '../core/middlewares/validateSocket.js';

export class OrderGateway {
  #io;
  #nameSpace;
  #orderService;

  /**
   * @constructor
   *
   * @param {Namespace} nameSpace
   * @param {Server} io
   */
  constructor(nameSpace, io) {
    this.#io = io;
    this.#nameSpace = nameSpace;
    this.#orderService = orderService;

    this.#nameSpace.use(socketDtoMiddleware(EventSchemas));

    this.#nameSpace.on('connection', (socket) => {
      logger.debug(`Client (${socket.id}) connected.`);

      socket.on(IncomingEventNames.CREATE_ORDER, async (data) =>
        this.handleCreateOrder(socket, data),
      );

      socket.on(IncomingEventNames.CANCEL_ORDER, async (data) =>
        this.handleCancelOrder(socket, data),
      );

      socket.on(IncomingEventNames.FILL_ORDER, async (data) =>
        this.handleFillOrder(socket, data),
      );

      socket.on('disconnect', () => {
        logger.debug(`Client (${socket.id}) disconnected.`);
      });
    });
  }

  /**
   * Handle a "createOrder" event from the client.
   *
   * @param {Socket} socket
   * @param {Object} data
   */
  async handleCreateOrder(socket, data) {
    console.log(data);
    if (!isValidationSuccess(IncomingEventNames.CREATE_ORDER, data)) {
      return;
    }

    try {
      const newOrder = await this.#orderService.createOrder(data);

      // Acknowledgment creation to the requesting client
      socket.emit(OutgoingEventNames.ORDER_CREATED, newOrder);

      console.log(newOrder);

      // Broadcast an update to all clients subscribed to this pair
      this.#io
        .of('/subscription')
        .to(newOrder.pair)
        .emit(OutgoingEventNames.ORDER_BOOK_UPDATE, {
          event: OutgoingEventNames.ORDER_CREATED,
          order: newOrder,
        });
    } catch (error) {
      this.handleError(socket, error);
    }
  }

  /**
   * Handle a "cancelOrder" event.
   *
   * @param {Socket} socket
   * @param {Object} data { orderId }
   */
  async handleCancelOrder(socket, data) {
    if (!isValidationSuccess(IncomingEventNames.CANCEL_ORDER, data)) {
      return;
    }

    try {
      const cancelledOrder = await this.#orderService.cancelOrder(data.orderId);

      if (!cancelledOrder) {
        // Possibly no such order
        return socket.emit(ErrorEventNames.ORDER_ERROR, {
          message: `Order ${data.orderId} not found or already cancelled`,
        });
      }

      // Notify client
      socket.emit(OutgoingEventNames.ORDER_CANCELLED, cancelledOrder);

      // Notify subscribers of that pair
      if (cancelledOrder.pair) {
        this.#nameSpace
          .to(cancelledOrder.pair)
          .emit(OutgoingEventNames.ORDER_BOOK_UPDATE, {
            event: OutgoingEventNames.ORDER_BOOK_UPDATE,
            order: cancelledOrder,
          });
      }
    } catch (error) {
      this.handleError(socket, error);
    }
  }

  /**
   * Handle a "fillOrder" event.
   *
   * @param {Socket} socket
   * @param {Object} data { orderId }
   */
  async handleFillOrder(socket, data) {
    // if (!isValidationSuccess(IncomingEventNames.FILL_ORDER, data)) {
    //   return;
    // }

    try {
      const filledOrder = await this.#orderService.fillOrder(data.orderId);

      if (!filledOrder) {
        return socket.emit(ErrorEventNames.ORDER_ERROR, {
          message: `Order ${data.orderId} not found or can't be filled`,
        });
      }

      socket.emit(OutgoingEventNames.ORDER_FILLED, filledOrder);

      // Broadcast to subscribed room
      if (filledOrder.pair) {
        this.#nameSpace
          .to(filledOrder.pair)
          .emit(OutgoingEventNames.ORDER_BOOK_UPDATE, {
            event: OutgoingEventNames.ORDER_FILLED,
            order: filledOrder,
          });
      }
    } catch (error) {
      this.handleError(socket, error);
    }
  }

  /**
   * A generic error handler for any async operation.
   */
  handleError(socket, error) {
    logger.error('[OrderGateway] Error:', error);
    return socket.emit(ErrorEventNames.GATEWAY_ERROR, {
      message: error.message || 'An error occurred',
    });
  }
}
