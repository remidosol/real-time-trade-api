import { Server, Socket } from 'socket.io';
import {
  ErrorEventNames,
  EventSchemas,
  IncomingEventNames,
  isValidationSuccess,
  OutgoingEventNames,
} from '../../events/index.js';
import logger from '../../../core/logger/Logger.js';
import { orderService } from '../services/OrderService.js';
import { socketDtoMiddleware } from '../../../core/middlewares/validateSocket.js';
import { EmitResponse } from '../../../core/responses/EmitResponse.js';

export class OrderSocketController {
  #io;
  #nameSpace;
  #orderService;

  /**
   * @constructor
   *
   * @param {Server} io
   */
  constructor(io) {
    this.#io = io;
    this.#orderService = orderService;

    this.#nameSpace = this.#io.of('/order');

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
      socket.emit(
        OutgoingEventNames.ORDER_CREATED,
        EmitResponse.Success({
          event: ErrorEventNames.ORDER_CREATED,
          message: 'Order has been created.',
          data: newOrder,
        }),
      );

      // Broadcast an update to all clients subscribed to this pair
      this.#io
        .of('/subscription')
        .to(newOrder.pair)
        .emit(
          OutgoingEventNames.ORDER_BOOK_UPDATE,
          EmitResponse.Success({
            event: ErrorEventNames.ORDER_CREATED,
            message: 'An Order has been created.',
            data: newOrder,
          }),
        );
    } catch (error) {
      this.handleError(socket, {
        ...error,
        message: 'createOrder error',
      });
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
        return socket.emit(
          ErrorEventNames.ORDER_ERROR,
          EmitResponse.Error({
            event: ErrorEventNames.ORDER_ERROR,
            message: `Order ${data.orderId} not found or already cancelled`,
          }),
        );
      }

      // Notify client
      socket.emit(OutgoingEventNames.ORDER_CANCELLED, cancelledOrder);

      // Notify subscribers of that pair
      if (cancelledOrder.pair) {
        this.#nameSpace.to(cancelledOrder.pair).emit(
          OutgoingEventNames.ORDER_BOOK_UPDATE,
          EmitResponse.Success({
            event: ErrorEventNames.ORDER_CANCELLED,
            message: 'An Order has been cancelled.',
            data: cancelledOrder,
          }),
        );
      }
    } catch (error) {
      this.handleError(socket, {
        ...error,
        message: 'cancelOrder error',
      });
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
        this.#nameSpace.to(filledOrder.pair).emit(
          OutgoingEventNames.ORDER_BOOK_UPDATE,
          EmitResponse.Success({
            event: ErrorEventNames.ORDER_FILLED,
            message: 'An Order has been filled.',
            data: filledOrder,
          }),
        );
      }
    } catch (error) {
      this.handleError(socket, {
        ...error,
        message: 'fillOrder error',
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
      context: '[OrderSocketController]',
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
}
