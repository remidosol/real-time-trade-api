import { setup, sleep } from '../../tests/testServerSetup.js';
import {
  ErrorEventNames,
  IncomingEventNames,
  OutgoingEventNames,
} from '../events/index.js';

describe('SubscriptionSocketController', () => {
  let clientSockets, cleanup;

  beforeAll(async () => {
    const setupResult = await setup();
    clientSockets = setupResult.clientSockets;
    cleanup = setupResult.cleanup;
  });

  afterAll(() => {
    cleanup();
  });

  test('should allow a client to subscribe to a trading pair', (done) => {
    const client = clientSockets[0];

    client.emit(IncomingEventNames.SUBSCRIBE_PAIR, { pair: 'ETH_USD' });

    client.on(OutgoingEventNames.SUBSCRIBED, (response) => {
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
    const client = clientSockets[0];

    client.emit(IncomingEventNames.SUBSCRIBE_PAIR, { pair: 'ETH_USD' });

    client.on(ErrorEventNames.SUBSCRIPTION_ERROR, (response) => {
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
    const client = clientSockets[0];

    client.emit(IncomingEventNames.UNSUBSCRIBE_PAIR, { pair: 'ETH_USD' });

    client.on(OutgoingEventNames.UNSUBSCRIBED, (response) => {
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
    const client = clientSockets[0];

    client.emit(IncomingEventNames.UNSUBSCRIBE_PAIR, { pair: 'ETH_USD' });

    client.on(ErrorEventNames.SUBSCRIPTION_ERROR, (response) => {
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
    const client = clientSockets[0];

    client.emit(IncomingEventNames.SUBSCRIBE_PAIR, { pair: 'BTC_USD' });

    await sleep(1000); // Give time for the subscription to complete

    client.emit(IncomingEventNames.GET_TOP_ORDER_BOOK, {});

    const response = await new Promise((resolve) => {
      client.on(OutgoingEventNames.TOP_ORDER_BOOK, (data) => {
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
    const client = clientSockets[0];

    client.emit(IncomingEventNames.UNSUBSCRIBE_PAIR, { pair: 'BTC_USD' });

    await sleep(1000);

    client.emit(IncomingEventNames.GET_TOP_ORDER_BOOK, {});

    const response = await new Promise((resolve) => {
      client.on(OutgoingEventNames.TOP_ORDER_BOOK, (data) => {
        resolve(data);
      });
    });

    expect(response.data).not.toHaveProperty('BTC_USD');
  });

  test('should automatically broadcast top order book data every 8 seconds', async () => {
    const client = clientSockets[0];

    client.emit(IncomingEventNames.SUBSCRIBE_PAIR, { pair: 'ETH_USD' });

    await sleep(1000);

    const response = await new Promise((resolve) => {
      client.on(OutgoingEventNames.TOP_ORDER_BOOK, (data) => {
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
    const client = clientSockets[0];

    client.emit(IncomingEventNames.SUBSCRIBE_PAIR, { pair: 'ETH_USD' });

    await sleep(1000);

    client.disconnect();

    await sleep(9000); // Wait to see if the interval stops

    client.connect();

    client.emit(IncomingEventNames.GET_TOP_ORDER_BOOK, {});

    const response = await new Promise((resolve) => {
      client.on(OutgoingEventNames.TOP_ORDER_BOOK, (data) => {
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
