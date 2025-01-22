import logger from './core/logger/logger.js';
import env from './core/config/env.js';
import app from './app.js';

const PORT = env.PORT ?? '3333';

const server = app.listen(+PORT, () => {
  logger.info(`Server is running on ${PORT} port`);
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');

  if (server) {
    server.close();
  }
});
