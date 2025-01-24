const schema = {
  asyncapi: '3.0.0',
  info: {
    title: 'Real-Time Trading API',
    version: '1.0.0',
    'x-linkedin': 'https://www.linkedin.com/in/ibrahim-aksut',
    description:
      'This AsyncAPI specification describes our Socket.IO-based trading platform. Clients can create orders, cancel orders, and subscribe to trade updates in real time.\n',
  },
  defaultContentType: 'application/json',
  servers: {
    development: {
      host: 'localhost:3333',
      pathname: '/socket.io',
      protocol: 'ws',
      description: 'Socket.IO server',
    },
  },
  channels: {
    createOrder: {
      address: 'createOrder',
      messages: {
        'orderCreated.message': {
          name: 'OrderCreatedEvent',
          title: 'Order Created (Event)',
          summary:
            "Server publishes 'orderCreated' event to notify that a new order has been created.",
          payload: {
            type: 'object',
            properties: {
              orderId: {
                type: 'string',
                example: 'abc123',
                'x-parser-schema-id': '<anonymous-schema-1>',
              },
              pair: {
                type: 'string',
                example: 'BTC-USD',
                'x-parser-schema-id': '<anonymous-schema-2>',
              },
              side: {
                type: 'string',
                example: 'buy',
                'x-parser-schema-id': '<anonymous-schema-3>',
              },
              price: {
                type: 'number',
                example: 20000,
                'x-parser-schema-id': '<anonymous-schema-4>',
              },
              quantity: {
                type: 'number',
                example: 1.5,
                'x-parser-schema-id': '<anonymous-schema-5>',
              },
              status: {
                type: 'string',
                example: 'open',
                'x-parser-schema-id': '<anonymous-schema-6>',
              },
            },
            required: [
              'orderId',
              'pair',
              'side',
              'price',
              'quantity',
              'status',
            ],
            'x-parser-schema-id': 'OrderCreatedPayload',
          },
          'x-parser-unique-object-id': 'orderCreated.message',
        },
        'createOrder.message': {
          name: 'CreateOrderRequest',
          title: 'Create Order (Request)',
          summary:
            "Client publishes a 'createOrder' event to create a new order.",
          payload: {
            type: 'object',
            properties: {
              pair: {
                type: 'string',
                example: 'BTC-USD',
                'x-parser-schema-id': '<anonymous-schema-7>',
              },
              side: {
                type: 'string',
                enum: ['buy', 'sell'],
                example: 'buy',
                'x-parser-schema-id': '<anonymous-schema-8>',
              },
              price: {
                type: 'number',
                example: 20000,
                'x-parser-schema-id': '<anonymous-schema-9>',
              },
              quantity: {
                type: 'number',
                example: 1.5,
                'x-parser-schema-id': '<anonymous-schema-10>',
              },
            },
            required: ['pair', 'side', 'price', 'quantity'],
            'x-parser-schema-id': 'CreateOrderPayload',
          },
          'x-parser-unique-object-id': 'createOrder.message',
        },
      },
      'x-parser-unique-object-id': 'createOrder',
    },
    cancelOrder: {
      address: 'cancelOrder',
      messages: {
        'orderCancelled.message': {
          name: 'OrderCancelledEvent',
          title: 'Order Canceled (Event)',
          payload: {
            type: 'object',
            properties: {
              orderId: {
                type: 'string',
                example: 'abc123',
                'x-parser-schema-id': '<anonymous-schema-11>',
              },
              status: {
                type: 'string',
                example: 'cancelled',
                'x-parser-schema-id': '<anonymous-schema-12>',
              },
            },
            required: ['orderId', 'status'],
            'x-parser-schema-id': 'OrderCancelledPayload',
          },
          'x-parser-unique-object-id': 'orderCancelled.message',
        },
        'cancelOrder.message': {
          name: 'CancelOrderRequest',
          title: 'Cancel Order (Request)',
          payload: {
            type: 'object',
            properties: {
              orderId: {
                type: 'string',
                example: 'abc123',
                'x-parser-schema-id': '<anonymous-schema-13>',
              },
            },
            required: ['orderId'],
            'x-parser-schema-id': 'CancelOrderPayload',
          },
          'x-parser-unique-object-id': 'cancelOrder.message',
        },
      },
      'x-parser-unique-object-id': 'cancelOrder',
    },
    tradeExecuted: {
      address: 'tradeExecuted',
      messages: {
        'tradeExecuted.message': {
          name: 'TradeExecutedEvent',
          title: 'Trade Executed (Event)',
          summary:
            "Server publishes 'tradeExecuted' event when a matching engine executes a trade.",
          payload: {
            type: 'object',
            properties: {
              tradeId: {
                type: 'string',
                example: 'trade-xyz789',
                'x-parser-schema-id': '<anonymous-schema-14>',
              },
              pair: {
                type: 'string',
                example: 'BTC-USD',
                'x-parser-schema-id': '<anonymous-schema-15>',
              },
              buyOrderId: {
                type: 'string',
                example: 'buy123',
                'x-parser-schema-id': '<anonymous-schema-16>',
              },
              sellOrderId: {
                type: 'string',
                example: 'sell456',
                'x-parser-schema-id': '<anonymous-schema-17>',
              },
              quantity: {
                type: 'number',
                example: 2,
                'x-parser-schema-id': '<anonymous-schema-18>',
              },
              price: {
                type: 'number',
                example: 20000,
                'x-parser-schema-id': '<anonymous-schema-19>',
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
                example: '2025-01-20T12:34:56.789Z',
                'x-parser-schema-id': '<anonymous-schema-20>',
              },
            },
            required: [
              'tradeId',
              'pair',
              'buyOrderId',
              'sellOrderId',
              'quantity',
              'price',
              'timestamp',
            ],
            'x-parser-schema-id': 'TradeExecutedPayload',
          },
          'x-parser-unique-object-id': 'tradeExecuted.message',
        },
      },
      'x-parser-unique-object-id': 'tradeExecuted',
    },
    getTopOrderBook: {
      address: 'getTopOrderBook',
      messages: {
        'topOrderBook.message': {
          name: 'TopOrderBookEvent',
          title: 'Top OrderBook (Response)',
          summary: 'Server responds with the top bids and asks for the pair.',
          payload: {
            type: 'object',
            properties: {
              pair: {
                type: 'string',
                example: 'BTC-USD',
                'x-parser-schema-id': '<anonymous-schema-21>',
              },
              bids: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    price: {
                      type: 'number',
                      'x-parser-schema-id': '<anonymous-schema-24>',
                    },
                    quantity: {
                      type: 'number',
                      'x-parser-schema-id': '<anonymous-schema-25>',
                    },
                    asks: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          price: {
                            type: 'number',
                            'x-parser-schema-id': '<anonymous-schema-28>',
                          },
                          quantity: {
                            type: 'number',
                            'x-parser-schema-id': '<anonymous-schema-29>',
                          },
                        },
                        'x-parser-schema-id': '<anonymous-schema-27>',
                      },
                      'x-parser-schema-id': '<anonymous-schema-26>',
                    },
                  },
                  'x-parser-schema-id': '<anonymous-schema-23>',
                },
                'x-parser-schema-id': '<anonymous-schema-22>',
              },
            },
            required: ['pair', 'bids', 'asks'],
            'x-parser-schema-id': 'TopOrderBookPayload',
          },
          'x-parser-unique-object-id': 'topOrderBook.message',
        },
        'getTopOrderBook.message': {
          name: 'GetTopOrderBookRequest',
          title: 'Get Top OrderBook (Request)',
          summary: 'Client requests the top N bids/asks for a given pair.',
          payload: {
            type: 'object',
            properties: {
              pair: {
                type: 'string',
                example: 'BTC-USD',
                'x-parser-schema-id': '<anonymous-schema-30>',
              },
              limit: {
                type: 'number',
                example: 5,
                'x-parser-schema-id': '<anonymous-schema-31>',
              },
            },
            required: ['pair'],
            'x-parser-schema-id': 'GetTopOrderBookPayload',
          },
          'x-parser-unique-object-id': 'getTopOrderBook.message',
        },
      },
      'x-parser-unique-object-id': 'getTopOrderBook',
    },
  },
  operations: {
    orderCreated: {
      action: 'receive',
      channel: '$ref:$.channels.createOrder',
      messages: ['$ref:$.channels.createOrder.messages.orderCreated.message'],
      'x-parser-unique-object-id': 'orderCreated',
    },
    createOrder: {
      action: 'send',
      channel: '$ref:$.channels.createOrder',
      messages: ['$ref:$.channels.createOrder.messages.createOrder.message'],
      'x-parser-unique-object-id': 'createOrder',
    },
    orderCancelled: {
      action: 'receive',
      channel: '$ref:$.channels.cancelOrder',
      messages: ['$ref:$.channels.cancelOrder.messages.orderCancelled.message'],
      'x-parser-unique-object-id': 'orderCancelled',
    },
    cancelOrder: {
      action: 'send',
      channel: '$ref:$.channels.cancelOrder',
      messages: ['$ref:$.channels.cancelOrder.messages.cancelOrder.message'],
      'x-parser-unique-object-id': 'cancelOrder',
    },
    tradeExecuted: {
      action: 'receive',
      channel: '$ref:$.channels.tradeExecuted',
      messages: [
        '$ref:$.channels.tradeExecuted.messages.tradeExecuted.message',
      ],
      'x-parser-unique-object-id': 'tradeExecuted',
    },
    topOrderBook: {
      action: 'receive',
      channel: '$ref:$.channels.getTopOrderBook',
      messages: [
        '$ref:$.channels.getTopOrderBook.messages.topOrderBook.message',
      ],
      'x-parser-unique-object-id': 'topOrderBook',
    },
    getTopOrderBook: {
      action: 'send',
      channel: '$ref:$.channels.getTopOrderBook',
      messages: [
        '$ref:$.channels.getTopOrderBook.messages.getTopOrderBook.message',
      ],
      'x-parser-unique-object-id': 'getTopOrderBook',
    },
  },
  components: {
    schemas: {
      CreateOrderPayload:
        '$ref:$.channels.createOrder.messages.createOrder.message.payload',
      OrderCreatedPayload:
        '$ref:$.channels.createOrder.messages.orderCreated.message.payload',
      CancelOrderPayload:
        '$ref:$.channels.cancelOrder.messages.cancelOrder.message.payload',
      OrderCancelledPayload:
        '$ref:$.channels.cancelOrder.messages.orderCancelled.message.payload',
      TradeExecutedPayload:
        '$ref:$.channels.tradeExecuted.messages.tradeExecuted.message.payload',
      GetTopOrderBookPayload:
        '$ref:$.channels.getTopOrderBook.messages.getTopOrderBook.message.payload',
      TopOrderBookPayload:
        '$ref:$.channels.getTopOrderBook.messages.topOrderBook.message.payload',
    },
  },
  'x-parser-spec-parsed': true,
  'x-parser-api-version': 3,
  'x-parser-spec-stringified': true,
};
const config = {
  show: { sidebar: true },
  sidebar: { showOperations: 'byDefault' },
};
const appRoot = document.getElementById('root');
AsyncApiStandalone.render({ schema, config }, appRoot);
