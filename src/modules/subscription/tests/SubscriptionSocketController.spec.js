import Redis from 'ioredis';
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
  it,
  afterEach,
} from '@jest/globals';
import { Socket as ClientSocket, io as ioc } from 'socket.io-client';
import { Server } from 'socket.io';

jest.mock('ioredis', () => require('ioredis-mock'));

describe('SubscriptionSocketController', () => {
  /**
   * @type {ClientSocket}
   */
  let clientSocket;

  /**
   * @type {Function}
   */
  let cleanUp;

  /**
   * @type {number}
   */
  let port;

  /**
   * @type {Redis}
   */
  let mockRedis;

  beforeAll(async () => {
    const setupData = await setup({ component: 'controller' });
    mockRedis = setupData.mockRedis;
    port = setupData.port;
    cleanUp = setupData.cleanUp;
  }, 15000);

  /**
   * Clean up everything once all tests have finished.
   */
  afterAll(async () => {
    if (clientSocket?.connected) {
      clientSocket.disconnect();
    }
    await mockRedis.flushall();
    cleanUp();
  }, 15000);

  /** ---------------------------------------------------------------------------
   * SUBSCRIBE / UNSUBSCRIBE TESTS
   * ---------------------------------------------------------------------------
   */
  describe('Subscribe-Unsubscribe Flow', () => {
    beforeAll((done) => {
      clientSocket = ioc(`ws://localhost:${port}/subscription`);
      clientSocket.on('connect', () => done());
    }, 15000);

    /**
     * Disconnect the client socket after each test to ensure a fresh state.
     * Also clear all Jest mocks to avoid contamination between tests.
     */
    afterEach(() => {
      jest.clearAllMocks();
      if (clientSocket?.connected) {
        clientSocket.disconnect();
      }
    });

    /**
     * Optional final cleanup after this block's tests finish
     */
    afterAll(async () => {
      await mockRedis.flushall();
    });

    it('should allow a client to subscribe to a trading pair', (done) => {
      clientSocket.emit(IncomingEventNames.SUBSCRIBE_PAIR, { pair: 'ETH_USD' });

      clientSocket.on(OutgoingEventNames.SUBSCRIBED, (response) => {
        expect(response).toEqual(
          expect.objectContaining({
            success: true,
            message: 'Subscribing to ETH_USD pair is successful',
          }),
        );
        done();
      });
    }, 15000);

    it('should prevent subscribing to the same pair twice', async () => {
      clientSocket.emit(IncomingEventNames.SUBSCRIBE_PAIR, { pair: 'ETH_USD' });

      // Wait for the SUBSCRIBED event
      await new Promise((resolve) => {
        clientSocket.once(OutgoingEventNames.SUBSCRIBED, resolve);
      });

      // Emit the second subscription
      clientSocket.emit(IncomingEventNames.SUBSCRIBE_PAIR, { pair: 'ETH_USD' });

      // Wait for SUBSCRIPTION_ERROR
      const errorResponse = await new Promise((resolve) => {
        clientSocket.once(ErrorEventNames.SUBSCRIPTION_ERROR, resolve);
      });

      expect(errorResponse).toMatchObject({
        success: false,
        message: 'You already subscribed to ETH_USD',
      });
    }, 25000);

    it('should allow a client to unsubscribe from a trading pair', async () => {
      clientSocket.emit(IncomingEventNames.SUBSCRIBE_PAIR, { pair: 'ETH_USD' });

      clientSocket.once(OutgoingEventNames.SUBSCRIBED, (firstRes) => {
        expect(firstRes).toEqual(
          expect.objectContaining({
            success: true,
            message: 'Subscribing to ETH_USD pair is successful',
          }),
        );

        clientSocket.emit(IncomingEventNames.UNSUBSCRIBE_PAIR, {
          pair: 'ETH_USD',
        });
      });

      clientSocket.once(OutgoingEventNames.UNSUBSCRIBED, (secondResp) => {
        expect(secondResp).toEqual(
          expect.objectContaining({
            success: true,
            message: 'Unsubscribing to ETH_USD pair is successful',
          }),
        );
        done();
      });
    }, 15000);

    it('should prevent unsubscribing from a pair the client is not subscribed to', (done) => {
      clientSocket.emit(IncomingEventNames.UNSUBSCRIBE_PAIR, {
        pair: 'ETH_USD',
      });

      clientSocket.on(ErrorEventNames.SUBSCRIPTION_ERROR, (response) => {
        expect(response).toEqual(
          expect.objectContaining({
            success: false,
            message: 'You are not subscribed to ETH_USD',
          }),
        );
        done();
      });
    }, 25000);
  });

  /** ---------------------------------------------------------------------------
   * TOP ORDER BOOK TESTS
   * ---------------------------------------------------------------------------
   * Uncomment if you want to test GET_TOP_ORDER_BOOK logic
   */
  // describe('Top Order Book', () => {
  //   beforeAll((done) => {
  //     clientSocket = ioc(`ws://localhost:${port}/subscription`);
  //     clientSocket.on('connect', () => done());
  //   }, 15000);

  //   afterEach(() => {
  //     jest.clearAllMocks();
  //   });

  //   afterAll(() => {
  //     if (clientSocket.connected) {
  //       clientSocket.disconnect();
  //     }
  //   });

  //   it('should return the top order book for subscribed pairs', (done) => {
  //     clientSocket.emit(IncomingEventNames.SUBSCRIBE_PAIR, { pair: 'BTC_USD' });
  //     clientSocket.emit(IncomingEventNames.GET_TOP_ORDER_BOOK, {});

  //     clientSocket.on(OutgoingEventNames.TOP_ORDER_BOOK, (response) => {
  //       expect(response).toEqual(
  //         expect.objectContaining({
  //           payloadEventKey: OutgoingEventNames.TOP_ORDER_BOOK,
  //           success: true,
  //           data: expect.objectContaining({
  //             BTC_USD: expect.any(Object),
  //           }),
  //         }),
  //       );
  //       done();
  //     });
  //   }, 15000);

  //   it('should not return order book data for unsubscribed pairs', (done) => {
  //     clientSocket.emit(IncomingEventNames.UNSUBSCRIBE_PAIR, { pair: 'BTC_USD' });
  //     clientSocket.emit(IncomingEventNames.GET_TOP_ORDER_BOOK, {});

  //     clientSocket.on(OutgoingEventNames.TOP_ORDER_BOOK, (response) => {
  //       expect(response.data).not.toHaveProperty('BTC_USD');
  //       done();
  //     });
  //   }, 15000);

  //   it('should automatically broadcast top order book data every 8 seconds', (done) => {
  //     clientSocket.emit(IncomingEventNames.SUBSCRIBE_PAIR, { pair: 'ETH_USD' });

  //     // The first broadcast might come in at 0-8 seconds
  //     clientSocket.on(OutgoingEventNames.TOP_ORDER_BOOK, (response) => {
  //       expect(response).toEqual(
  //         expect.objectContaining({
  //           payloadEventKey: OutgoingEventNames.TOP_ORDER_BOOK,
  //           data: expect.objectContaining({
  //             ETH_USD: expect.any(Object),
  //           }),
  //         }),
  //       );
  //       done();
  //     });
  //   }, 15000);
  // });

  /** ---------------------------------------------------------------------------
   * BROADCASTING TESTS
   * ---------------------------------------------------------------------------
   * Uncomment if you want to test broadcast intervals and disconnection logic
   */
  // describe('Broadcasting', () => {
  //   beforeAll((done) => {
  //     clientSocket = ioc(`ws://localhost:${port}/subscription`);
  //     clientSocket.on('connect', () => done());
  //   }, 15000);

  //   afterEach(() => {
  //     jest.clearAllMocks();
  //   });

  //   afterAll(() => {
  //     if (clientSocket.connected) {
  //       clientSocket.disconnect();
  //     }
  //   });

  //   it('should stop broadcasting when all clients disconnect', async () => {
  //     clientSocket.emit(IncomingEventNames.SUBSCRIBE_PAIR, { pair: 'ETH_USD' });

  //     await sleep(1000); // small delay
  //     clientSocket.disconnect();

  //     await sleep(2000); // Wait to see if the interval stops internally

  //     // Reconnect the client
  //     clientSocket.connect();
  //     clientSocket.emit(IncomingEventNames.GET_TOP_ORDER_BOOK, {});

  //     // Wait for the next broadcast or response
  //     const response = await new Promise((resolve) => {
  //       clientSocket.on(OutgoingEventNames.TOP_ORDER_BOOK, (data) => resolve(data));
  //     });

  //     expect(response).toEqual(
  //       expect.objectContaining({
  //         payloadEventKey: OutgoingEventNames.TOP_ORDER_BOOK,
  //         data: expect.objectContaining({
  //           ETH_USD: expect.any(Object),
  //         }),
  //       }),
  //     );
  //   }, 15000);
  // });
});
