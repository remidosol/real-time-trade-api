import { setup, sleep } from '../../tests/testServerSetup.js';
import {
  IncomingEventNames,
  OutgoingEventNames,
  ErrorEventNames,
} from '../events/index.js';

describe('OrderSocketController', () => {
  let clientSockets, cleanup;

  beforeAll(async () => {
    const setupResult = await setup();
    clientSockets = setupResult.clientSockets;
    cleanup = setupResult.cleanup;
  });

  afterAll(() => {
    cleanup();
  });

  test('should create an order successfully', (done) => {
    const client = clientSockets[0];

    const orderData = {
      pair: 'ETH_USD',
      side: 'BUY',
      price: 1500,
      quantity: 1,
    };

    client.emit(IncomingEventNames.CREATE_ORDER, orderData);

    client.on(OutgoingEventNames.ORDER_CREATED, (response) => {
      expect(response).toEqual(
        expect.objectContaining({
          eventEmit: OutgoingEventNames.ORDER_CREATED,
          message: 'Order has been created.',
          data: expect.objectContaining({
            pair: 'ETH_USD',
            side: 'BUY',
            price: 1500,
            quantity: 1,
          }),
        }),
      );
      done();
    });
  });

  test('should reject creating an order with invalid data', (done) => {
    const client = clientSockets[0];

    const invalidOrderData = {
      pair: 'INVALID_PAIR',
      side: 'BUY',
      price: -500,
      quantity: -1,
    };

    client.emit(IncomingEventNames.CREATE_ORDER, invalidOrderData);

    client.on(ErrorEventNames.ORDER_ERROR, (response) => {
      expect(response).toEqual(
        expect.objectContaining({
          eventEmit: ErrorEventNames.ORDER_ERROR,
          message: expect.stringContaining('validation error'),
        }),
      );
      done();
    });
  });

  test('should cancel an existing order', async () => {
    const client = clientSockets[0];

    // Step 1: Create an order first
    const orderData = {
      pair: 'BTC_USD',
      side: 'SELL',
      price: 25000,
      quantity: 0.5,
    };

    client.emit(IncomingEventNames.CREATE_ORDER, orderData);

    const createdOrder = await new Promise((resolve) => {
      client.on(OutgoingEventNames.ORDER_CREATED, (response) => {
        resolve(response.data);
      });
    });

    // Step 2: Cancel the created order
    client.emit(IncomingEventNames.CANCEL_ORDER, {
      orderId: createdOrder.orderId,
    });

    const response = await new Promise((resolve) => {
      client.on(OutgoingEventNames.ORDER_CANCELLED, (data) => {
        resolve(data);
      });
    });

    expect(response).toEqual(
      expect.objectContaining({
        eventEmit: OutgoingEventNames.ORDER_CANCELLED,
        message: 'An Order has been cancelled.',
        data: expect.objectContaining({
          orderId: createdOrder.orderId,
          status: 'CANCELLED',
        }),
      }),
    );
  });

  test('should prevent canceling a non-existing order', (done) => {
    const client = clientSockets[0];

    client.emit(IncomingEventNames.CANCEL_ORDER, {
      orderId: 'non-existent-id',
    });

    client.on(ErrorEventNames.ORDER_ERROR, (response) => {
      expect(response).toEqual(
        expect.objectContaining({
          eventEmit: ErrorEventNames.ORDER_ERROR,
          message: expect.stringContaining('not found or already cancelled'),
        }),
      );
      done();
    });
  });

  test('should fill an existing order', async () => {
    const client = clientSockets[0];

    // Step 1: Create an order first
    const orderData = {
      pair: 'BTC_USD',
      side: 'BUY',
      price: 23000,
      quantity: 1,
    };

    client.emit(IncomingEventNames.CREATE_ORDER, orderData);

    const createdOrder = await new Promise((resolve) => {
      client.on(OutgoingEventNames.ORDER_CREATED, (response) => {
        resolve(response.data);
      });
    });

    // Step 2: Fill the created order
    client.emit(IncomingEventNames.FILL_ORDER, {
      orderId: createdOrder.orderId,
    });

    const response = await new Promise((resolve) => {
      client.on(OutgoingEventNames.ORDER_FILLED, (data) => {
        resolve(data);
      });
    });

    expect(response).toEqual(
      expect.objectContaining({
        eventEmit: OutgoingEventNames.ORDER_FILLED,
        message: 'An Order has been filled.',
        data: expect.objectContaining({
          orderId: createdOrder.orderId,
          status: 'FILLED',
        }),
      }),
    );
  });

  test('should prevent filling a non-existing order', (done) => {
    const client = clientSockets[0];

    client.emit(IncomingEventNames.FILL_ORDER, { orderId: 'non-existent-id' });

    client.on(ErrorEventNames.ORDER_ERROR, (response) => {
      expect(response).toEqual(
        expect.objectContaining({
          eventEmit: ErrorEventNames.ORDER_ERROR,
          message: expect.stringContaining("can't be filled"),
        }),
      );
      done();
    });
  });

  test('should broadcast order updates to subscribed clients', async () => {
    const client = clientSockets[0];
    const subscriber = clientSockets[1];

    // Subscriber joins the trading pair room
    subscriber.emit(IncomingEventNames.SUBSCRIBE_PAIR, { pair: 'BTC_USD' });

    await sleep(1000);

    // Create an order
    const orderData = {
      pair: 'BTC_USD',
      side: 'SELL',
      price: 24500,
      quantity: 0.5,
    };

    client.emit(IncomingEventNames.CREATE_ORDER, orderData);

    const response = await new Promise((resolve) => {
      subscriber.on(OutgoingEventNames.ORDER_BOOK_UPDATE, (data) => {
        resolve(data);
      });
    });

    expect(response).toEqual(
      expect.objectContaining({
        eventEmit: OutgoingEventNames.ORDER_BOOK_UPDATE,
        message: 'An order has been created.',
        data: expect.objectContaining({
          pair: 'BTC_USD',
          side: 'SELL',
          price: 24500,
          quantity: 0.5,
        }),
      }),
    );
  });

  test('should prevent filling an order that is already cancelled', async () => {
    const client = clientSockets[0];

    // Step 1: Create an order
    const orderData = {
      pair: 'BTC_USD',
      side: 'BUY',
      price: 25500,
      quantity: 1,
    };

    client.emit(IncomingEventNames.CREATE_ORDER, orderData);

    const createdOrder = await new Promise((resolve) => {
      client.on(OutgoingEventNames.ORDER_CREATED, (response) => {
        resolve(response.data);
      });
    });

    // Step 2: Cancel the order
    client.emit(IncomingEventNames.CANCEL_ORDER, {
      orderId: createdOrder.orderId,
    });

    await new Promise((resolve) => {
      client.on(OutgoingEventNames.ORDER_CANCELLED, () => resolve());
    });

    // Step 3: Try filling the cancelled order
    client.emit(IncomingEventNames.FILL_ORDER, {
      orderId: createdOrder.orderId,
    });

    const response = await new Promise((resolve) => {
      client.on(ErrorEventNames.ORDER_ERROR, (data) => {
        resolve(data);
      });
    });

    expect(response).toEqual(
      expect.objectContaining({
        eventEmit: ErrorEventNames.ORDER_ERROR,
        message: `Order ${createdOrder.orderId} not found or can't be filled`,
      }),
    );
  });
});
