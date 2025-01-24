import { Socket } from 'socket.io';
import { ErrorEventNames, EventSchemas } from '../../modules/events/index.js';

/**
 * To validate received payload in a socket for events
 *
 * @param {EventSchemas} eventSchemas
 *
 * @returns {(socket: Socket, next: (err: Error) => void)) => void}
 */
export const socketDtoMiddleware = (eventSchemas) => {
  return (socket, next) => {
    socket.onAny((event, data) => {
      if (eventSchemas[event]) {
        const schema = eventSchemas[event];

        const validation = schema.safeParse(data);

        if (!validation.success) {
          return socket.emit(ErrorEventNames.VALIDATION_ERROR, {
            event,
            message: 'Invalid data',
            errors: validation.error.errors,
          });
        }
      }
    });
    next();
  };
};
