import env from './config/env.js';
import path from 'path';
import { existsSync } from 'fs';
import { server as app } from './app.js';
import logger from './core/logger/Logger.js';
import Generator from '@asyncapi/generator';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createAsyncapiFile = async () => {
  const generator = new Generator(
    '@asyncapi/html-template',
    path.resolve(__dirname, '../docs'),
    {
      forceWrite: true,
      templateParams: {
        // baseHref: 'docs/',
      },
    },
  );

  await generator.generateFromFile(path.resolve(__dirname, '../asyncapi.yaml'));
};

const initServer = async () => {
  const PORT = env.PORT ?? '3333';

  if (
    env.NODE_ENV === 'dev' &&
    !existsSync(path.resolve(__dirname, '../docs/index.html'))
  ) {
    await createAsyncapiFile();
  }

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
    logger.error({ ...error, context: '[Express]' });
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
};

initServer();
