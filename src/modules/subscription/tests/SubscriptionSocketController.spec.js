import { setup, sleep } from '../../../../tests/testServerSetup.js';
import {
  ErrorEventNames,
  IncomingEventNames,
  OutgoingEventNames,
} from '../../events/index.js';
import {
  describe,
  beforeAll,
  afterAll,
  expect,
  beforeEach,
  test,
} from '@jest/globals';
import { Socket as ClientSocket } from 'socket.io-client';

jest.mock('ioredis', () => require('ioredis-mock'));

describe('SubscriptionSocketController', () => {
  /**
   * @type {ClientSocket}
   */
  let clientSocket;

  let cleanup;

  /**
   * @type {Redis}
   */
  let mockRedis;

  beforeAll(async () => {
    const setupResult = await setup({
      clientOptions: { path: '/subscription' },
    });

    clientSocket = setupResult.clientSockets[0];
    mockRedis = setupResult.mockRedisClients[0];
    cleanup = setupResult.cleanup;
  }, 10000);

  beforeEach(async () => {
    jest.clearAllMocks();
    await mockRedis.flushall();
  });

  afterAll(() => {
    cleanup();
  });

  test('should allow a client to subscribe to a trading pair', (done) => {
    clientSocket.emit(IncomingEventNames.SUBSCRIBE_PAIR, { pair: 'ETH_USD' });

    clientSocket.on(OutgoingEventNames.SUBSCRIBED, (response) => {
      console.log(response);
      expect(response).toEqual(
        expect.objectContaining({
          eventEmit: OutgoingEventNames.SUBSCRIBED,
          message: 'Subscribing to ETH_USD pair is successful',
        }),
      );
      done();
    });
  });

  test('should prevent subscribing to the same pair twice', (done) => {
    clientSocket.emit(IncomingEventNames.SUBSCRIBE_PAIR, { pair: 'ETH_USD' });

    clientSocket.on(ErrorEventNames.SUBSCRIPTION_ERROR, (response) => {
      expect(response).toEqual(
        expect.objectContaining({
          eventEmit: ErrorEventNames.SUBSCRIPTION_ERROR,
          message: 'You already subscribed to ETH_USD',
        }),
      );
      done();
    });
  });

  test('should allow a client to unsubscribe from a trading pair', (done) => {
    clientSocket.emit(IncomingEventNames.UNSUBSCRIBE_PAIR, { pair: 'ETH_USD' });

    clientSocket.on(OutgoingEventNames.UNSUBSCRIBED, (response) => {
      expect(response).toEqual(
        expect.objectContaining({
          eventEmit: OutgoingEventNames.UNSUBSCRIBED,
          message: 'Unsubscribing to ETH_USD pair is successful',
        }),
      );
      done();
    });
  });

  test('should prevent unsubscribing from a pair the client is not subscribed to', (done) => {
    clientSocket.emit(IncomingEventNames.UNSUBSCRIBE_PAIR, { pair: 'ETH_USD' });

    clientSocket.on(ErrorEventNames.SUBSCRIPTION_ERROR, (response) => {
      expect(response).toEqual(
        expect.objectContaining({
          eventEmit: ErrorEventNames.SUBSCRIPTION_ERROR,
          message: 'You are not subscribed to ETH_USD',
        }),
      );
      done();
    });
  });

  test('should return the top order book for subscribed pairs', async () => {
    clientSocket.emit(IncomingEventNames.SUBSCRIBE_PAIR, { pair: 'BTC_USD' });

    await sleep(1000); // Give time for the subscription to complete

    clientSocket.emit(IncomingEventNames.GET_TOP_ORDER_BOOK, {});

    const response = await new Promise((resolve) => {
      clientSocket.on(OutgoingEventNames.TOP_ORDER_BOOK, (data) => {
        resolve(data);
      });
    });

    expect(response).toEqual(
      expect.objectContaining({
        eventEmit: OutgoingEventNames.TOP_ORDER_BOOK,
        data: expect.objectContaining({
          BTC_USD: expect.any(Object),
        }),
      }),
    );
  });

  test('should not return order book data for unsubscribed pairs', async () => {
    clientSocket.emit(IncomingEventNames.UNSUBSCRIBE_PAIR, { pair: 'BTC_USD' });

    await sleep(1000);

    clientSocket.emit(IncomingEventNames.GET_TOP_ORDER_BOOK, {});

    const response = await new Promise((resolve) => {
      clientSocket.on(OutgoingEventNames.TOP_ORDER_BOOK, (data) => {
        resolve(data);
      });
    });

    expect(response.data).not.toHaveProperty('BTC_USD');
  });

  test('should automatically broadcast top order book data every 8 seconds', async () => {
    clientSocket.emit(IncomingEventNames.SUBSCRIBE_PAIR, { pair: 'ETH_USD' });

    await sleep(1000);

    const response = await new Promise((resolve) => {
      clientSocket.on(OutgoingEventNames.TOP_ORDER_BOOK, (data) => {
        resolve(data);
      });
    });

    expect(response).toEqual(
      expect.objectContaining({
        eventEmit: OutgoingEventNames.TOP_ORDER_BOOK,
        data: expect.objectContaining({
          ETH_USD: expect.any(Object),
        }),
      }),
    );
  });

  test('should stop broadcasting when all clients disconnect', async () => {
    clientSocket.emit(IncomingEventNames.SUBSCRIBE_PAIR, { pair: 'ETH_USD' });

    await sleep(1000);

    clientSocket.disconnect();

    await sleep(9000); // Wait to see if the interval stops

    clientSocket.connect();

    clientSocket.emit(IncomingEventNames.GET_TOP_ORDER_BOOK, {});

    const response = await new Promise((resolve) => {
      clientSocket.on(OutgoingEventNames.TOP_ORDER_BOOK, (data) => {
        resolve(data);
      });
    });

    expect(response).toEqual(
      expect.objectContaining({
        eventEmit: OutgoingEventNames.TOP_ORDER_BOOK,
        data: expect.objectContaining({
          ETH_USD: expect.any(Object),
        }),
      }),
    );
  });
});
