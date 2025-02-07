import {
  afterAll,
  afterEach,
  beforeEach,
  beforeAll,
  describe,
  expect,
  test,
} from '@jest/globals';
import Redis from 'ioredis';
import { Socket as ClientSocket, io as ioc } from 'socket.io-client';
import { Server, Socket as ServerSocket } from 'socket.io';
import { setup } from '../../../../tests/testServerSetup.js';
import {
  ErrorEventNames,
  IncomingEventNames,
  OutgoingEventNames,
} from '../../events/index.js';
import { TradeStatus } from '../tradeConstants.js';
import { SpiedFunction } from 'jest-mock';
import { v4 as uuidv4 } from 'uuid';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-trade-id'),
}));

jest.mock('ioredis', () => require('ioredis-mock'));

describe('TradeSocketController', () => {
  /**
   * @type {ClientSocket}
   */
  let clientSocket;

  /**
   * @type {Server}
   */
  let server;

  let cleanUp;

  let port;

  /**
   * @type {Redis}
   */
  let mockRedis;

  /**
   *
   * @type {{ [key: string]: SpiedFunction }}
   */
  let mockTradeService;

  beforeAll(async () => {
    const setupData = await setup({
      component: 'controller',
    });

    mockRedis = setupData.mockRedis;
    port = setupData.port;
    cleanUp = setupData.cleanUp;
    mockTradeService = setupData.spyOns.tradeService;
    server = setupData.server;
  }, 15000);

  beforeEach((done) => {
    clientSocket = ioc(`ws://localhost:${port}/trade`);
    clientSocket.on('connect', () => {
      done();
    });
  }, 8000);

  afterEach((done) => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    jest.clearAllMocks();

    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
    done();
  }, 8000);

  afterAll(async () => {
    await mockRedis.flushall();
    cleanUp();
  });

  describe('MATCH_TOP_ORDERS', () => {
    test('should emit NO_TRADE when no matching orders exist', (done) => {
      mockTradeService.matchTopOrders.mockResolvedValueOnce(null);

      clientSocket.emit(IncomingEventNames.MATCH_TOP_ORDERS, {
        pair: 'BTC_USD',
      });

      clientSocket.on(OutgoingEventNames.NO_TRADE, (response) => {
        expect(response.data).toBe('BTC_USD');
        expect(mockTradeService.matchTopOrders).toHaveBeenCalledWith('BTC_USD');
        done();
      });
    }, 15000);

    test('should emit TRADE_EXECUTED and broadcast TRADE_UPDATE when a trade is matched', (done) => {
      const tradeData = {
        tradeId: 'mock-trade-id',
        pair: 'BTC_USD',
        quantity: 1,
        price: 50000,
        status: TradeStatus.EXECUTED,
      };

      mockTradeService.matchTopOrders.mockResolvedValueOnce(tradeData);

      clientSocket.emit(IncomingEventNames.MATCH_TOP_ORDERS, {
        pair: 'BTC_USD',
      });

      clientSocket.on(OutgoingEventNames.TRADE_EXECUTED, (response) => {
        expect(response.data).toEqual(tradeData);
        expect(mockTradeService.matchTopOrders).toHaveBeenCalledWith('BTC_USD');
        done();
      });
    }, 15000);
  });

  describe('GET_RECENT_TRADES', () => {
    test('should emit RECENT_TRADES when fetching recent trades', (done) => {
      const trades = [
        {
          tradeId: 'mock-trade-id',
          pair: 'BTC_USD',
          price: 48000,
          quantity: 1,
        },
      ];

      mockTradeService.getRecentTrades.mockResolvedValueOnce(trades);

      clientSocket.emit(IncomingEventNames.GET_RECENT_TRADES, {
        pair: 'BTC_USD',
        limit: 5,
      });

      clientSocket.on(OutgoingEventNames.RECENT_TRADES, (response) => {
        expect(response.data).toEqual({ pair: 'BTC_USD', trades });
        expect(mockTradeService.getRecentTrades).toHaveBeenCalledWith(
          'BTC_USD',
          5,
        );
        done();
      });
    }, 15000);

    test('should use default limit when no limit is provided', (done) => {
      const trades = [
        {
          tradeId: 'mock-trade-id',
          pair: 'ETH_USD',
          price: 3200,
          quantity: 0.5,
        },
      ];

      mockTradeService.getRecentTrades.mockResolvedValueOnce(trades);

      clientSocket.emit(IncomingEventNames.GET_RECENT_TRADES, {
        pair: 'ETH_USD',
      });

      clientSocket.on(OutgoingEventNames.RECENT_TRADES, (response) => {
        console.log(response);
        expect(response.data).toEqual({ pair: 'ETH_USD', trades });
        expect(mockTradeService.getRecentTrades).toHaveBeenCalledWith(
          'ETH_USD',
          10,
        );
        done();
      });
    }, 15000);

    test('should emit GATEWAY_ERROR if fetching recent trades fails', (done) => {
      const error = new Error('Database error');

      mockTradeService.getRecentTrades.mockRejectedValueOnce(error);

      clientSocket.emit(IncomingEventNames.GET_RECENT_TRADES, {
        pair: 'BTC_USD',
        limit: 5,
      });

      clientSocket.on(ErrorEventNames.GATEWAY_ERROR, (response) => {
        expect(response.message).toBe('Database error');
        done();
      });
    }, 15000);
  });

  /** -----------------------------------------------------------------------------------
   * TESTING ERROR HANDLING
   * -----------------------------------------------------------------------------------
   */
  describe('Error Handling', () => {
    test('should emit GATEWAY_ERROR if matchTopOrders fails', (done) => {
      const error = new Error('Trade execution failed');
      mockTradeService.matchTopOrders.mockRejectedValueOnce(error);

      clientSocket.emit(IncomingEventNames.MATCH_TOP_ORDERS, {
        pair: 'BTC_USD',
      });

      clientSocket.on(ErrorEventNames.GATEWAY_ERROR, (response) => {
        expect(response.message).toBe('Trade execution failed');
        done();
      });
    }, 15000);

    test('should log and emit GATEWAY_ERROR on unexpected error', (done) => {
      const error = new Error('Unexpected failure');
      mockTradeService.matchTopOrders.mockRejectedValueOnce(error);

      clientSocket.emit(IncomingEventNames.MATCH_TOP_ORDERS, {
        pair: 'BTC_USD',
      });

      clientSocket.on(ErrorEventNames.GATEWAY_ERROR, (response) => {
        expect(response.message).toBe('Unexpected failure');
        done();
      });
    }, 15000);
  });
});
