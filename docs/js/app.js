const schema = {
  asyncapi: '3.0.0',
  info: {
    title: 'Real-Time Trading API',
    version: '1.0.0',
    'x-linkedin': 'https://www.linkedin.com/in/ibrahim-aksut',
    description:
      'This AsyncAPI specification describes our Socket.IO-based trading platform. Clients can create orders, cancel orders, subscribe to order book updates, and receive real-time trade execution notifications.\n',
  },
  defaultContentType: 'application/json',
  servers: {
    development: {
      host: 'localhost:3333',
      pathname: '/socket.io',
      protocol: 'ws',
      description: 'Socket.IO WebSocket server',
    },
  },
  channels: {
    createOrder: {
      address: 'createOrder',
      messages: {
        'createOrder.message': {
          name: 'CreateOrderRequest',
          title: 'Create Order (Request)',
          summary:
            "Client publishes a 'createOrder' event to create a new order.",
          payload: {
            oneOf: [
              {
                type: 'object',
                properties: {
                  orderType: {
                    type: 'string',
                    enum: ['LIMIT', 'MARKET'],
                    example: 'LIMIT',
                    'x-parser-schema-id': 'OrderType',
                  },
                  pair: {
                    type: 'string',
                    example: 'BTC-USD',
                    'x-parser-schema-id': '<anonymous-schema-2>',
                  },
                  side: {
                    type: 'string',
                    enum: ['BUY', 'SELL'],
                    example: 'BUY',
                    'x-parser-schema-id': 'Side',
                  },
                  price: {
                    type: 'number',
                    example: 20000,
                    'x-parser-schema-id': '<anonymous-schema-3>',
                  },
                  quantity: {
                    type: 'number',
                    example: 1.5,
                    'x-parser-schema-id': '<anonymous-schema-4>',
                  },
                },
                required: ['orderType', 'pair', 'side', 'price', 'quantity'],
                description: 'LIMIT order requires price and quantity.',
                'x-parser-schema-id': '<anonymous-schema-1>',
              },
              {
                type: 'object',
                properties: {
                  orderType:
                    '$ref:$.channels.createOrder.messages.createOrder.message.payload.oneOf[0].properties.orderType',
                  pair: {
                    type: 'string',
                    example: 'BTC-USD',
                    'x-parser-schema-id': '<anonymous-schema-6>',
                  },
                  side: '$ref:$.channels.createOrder.messages.createOrder.message.payload.oneOf[0].properties.side',
                  quantity: {
                    type: 'number',
                    example: 1.5,
                    'x-parser-schema-id': '<anonymous-schema-7>',
                  },
                },
                required: ['orderType', 'pair', 'side', 'quantity'],
                description:
                  'MARKET order only requires quantity, price should not be provided.',
                'x-parser-schema-id': '<anonymous-schema-5>',
              },
            ],
            'x-parser-schema-id': 'CreateOrderPayload',
          },
          'x-parser-unique-object-id': 'createOrder.message',
        },
        'orderCreated.message': {
          name: 'OrderCreatedEvent',
          title: 'Order Created (Event)',
          summary:
            "Server publishes 'orderCreated' event to notify that a new order has been created.\n",
          payload: {
            type: 'object',
            properties: {
              orderId: {
                type: 'string',
                example: 'abc123',
                'x-parser-schema-id': '<anonymous-schema-8>',
              },
              pair: {
                type: 'string',
                enum: ['ETH_USD', 'BTC_USD', 'XRP_USD', 'LTC_USD', 'BNB_USD'],
                example: 'BTC_USD',
                'x-parser-schema-id': '<anonymous-schema-9>',
              },
              side: {
                type: 'string',
                enum: ['BUY', 'SELL'],
                example: 'BUY',
                'x-parser-schema-id': '<anonymous-schema-10>',
              },
              orderType: {
                type: 'string',
                enum: ['LIMIT', 'MARKET'],
                example: 'LIMIT',
                'x-parser-schema-id': '<anonymous-schema-11>',
              },
              price: {
                type: 'number',
                example: 20000,
                'x-parser-schema-id': '<anonymous-schema-12>',
              },
              quantity: {
                type: 'number',
                example: 1.5,
                'x-parser-schema-id': '<anonymous-schema-13>',
              },
              status: {
                type: 'string',
                example: 'open',
                'x-parser-schema-id': '<anonymous-schema-14>',
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
      },
      'x-parser-unique-object-id': 'createOrder',
    },
    cancelOrder: {
      address: 'cancelOrder',
      messages: {
        'cancelOrder.message': {
          name: 'CancelOrderRequest',
          title: 'Cancel Order (Request)',
          payload: {
            type: 'object',
            properties: {
              orderId: {
                type: 'string',
                example: 'abc123',
                'x-parser-schema-id': '<anonymous-schema-15>',
              },
            },
            required: ['orderId'],
            'x-parser-schema-id': 'CancelOrderPayload',
          },
          'x-parser-unique-object-id': 'cancelOrder.message',
        },
        'orderCancelled.message': {
          name: 'OrderCancelledEvent',
          title: 'Order Canceled (Event)',
          payload: {
            type: 'object',
            properties: {
              orderId: {
                type: 'string',
                example: 'abc123',
                'x-parser-schema-id': '<anonymous-schema-16>',
              },
              status: {
                type: 'string',
                example: 'cancelled',
                'x-parser-schema-id': '<anonymous-schema-17>',
              },
            },
            required: ['orderId', 'status'],
            'x-parser-schema-id': 'OrderCancelledPayload',
          },
          'x-parser-unique-object-id': 'orderCancelled.message',
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
            "Server publishes 'tradeExecuted' event when a matching engine executes a trade.\n",
          payload: {
            type: 'object',
            properties: {
              tradeId: {
                type: 'string',
                example: 'trade-xyz789',
                'x-parser-schema-id': '<anonymous-schema-18>',
              },
              pair: {
                type: 'string',
                enum: ['ETH_USD', 'BTC_USD', 'XRP_USD', 'LTC_USD', 'BNB_USD'],
                example: 'BTC_USD',
                'x-parser-schema-id': '<anonymous-schema-19>',
              },
              buyOrderId: {
                type: 'string',
                example: 'buy123',
                'x-parser-schema-id': '<anonymous-schema-20>',
              },
              sellOrderId: {
                type: 'string',
                example: 'sell456',
                'x-parser-schema-id': '<anonymous-schema-21>',
              },
              quantity: {
                type: 'number',
                example: 2,
                'x-parser-schema-id': '<anonymous-schema-22>',
              },
              price: {
                type: 'number',
                example: 20000,
                'x-parser-schema-id': '<anonymous-schema-23>',
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
                example: '2025-01-20T12:34:56.789Z',
                'x-parser-schema-id': '<anonymous-schema-24>',
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
        'getTopOrderBook.message': {
          name: 'GetTopOrderBookRequest',
          title: 'Get Top OrderBook (Request)',
          summary: 'Client requests the top N bids/asks for a given pair.',
          payload: {
            type: 'object',
            properties: {
              pair: {
                type: 'string',
                enum: ['ETH_USD', 'BTC_USD', 'XRP_USD', 'LTC_USD', 'BNB_USD'],
                example: 'BTC_USD',
                'x-parser-schema-id': '<anonymous-schema-25>',
              },
              limit: {
                type: 'number',
                example: 5,
                'x-parser-schema-id': '<anonymous-schema-26>',
              },
            },
            required: ['pair'],
            'x-parser-schema-id': 'GetTopOrderBookPayload',
          },
          'x-parser-unique-object-id': 'getTopOrderBook.message',
        },
        'topOrderBook.message': {
          name: 'TopOrderBookEvent',
          title: 'Top OrderBook (Response)',
          summary: 'Server responds with the top bids and asks for the pair.',
          payload: {
            type: 'object',
            properties: {
              event: {
                type: 'string',
                example: 'topOrderBook',
                'x-parser-schema-id': '<anonymous-schema-27>',
              },
              success: {
                type: 'boolean',
                example: true,
                'x-parser-schema-id': '<anonymous-schema-28>',
              },
              data: {
                type: 'object',
                additionalProperties: {
                  type: 'object',
                  properties: {
                    bids: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          orderId: {
                            type: 'string',
                            'x-parser-schema-id': '<anonymous-schema-33>',
                          },
                          pair: {
                            type: 'string',
                            enum: [
                              'ETH_USD',
                              'BTC_USD',
                              'XRP_USD',
                              'LTC_USD',
                              'BNB_USD',
                            ],
                            'x-parser-schema-id': '<anonymous-schema-34>',
                          },
                          price: {
                            type: 'number',
                            'x-parser-schema-id': '<anonymous-schema-35>',
                          },
                          quantity: {
                            type: 'number',
                            'x-parser-schema-id': '<anonymous-schema-36>',
                          },
                          side: {
                            type: 'string',
                            enum: ['BUY', 'SELL'],
                            'x-parser-schema-id': '<anonymous-schema-37>',
                          },
                          orderType: {
                            type: 'string',
                            enum: ['LIMIT', 'MARKET'],
                            'x-parser-schema-id': '<anonymous-schema-38>',
                          },
                          status: {
                            type: 'string',
                            'x-parser-schema-id': '<anonymous-schema-39>',
                          },
                        },
                        'x-parser-schema-id': '<anonymous-schema-32>',
                      },
                      'x-parser-schema-id': '<anonymous-schema-31>',
                    },
                    asks: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          orderId: {
                            type: 'string',
                            'x-parser-schema-id': '<anonymous-schema-42>',
                          },
                          pair: {
                            type: 'string',
                            enum: [
                              'ETH_USD',
                              'BTC_USD',
                              'XRP_USD',
                              'LTC_USD',
                              'BNB_USD',
                            ],
                            'x-parser-schema-id': '<anonymous-schema-43>',
                          },
                          price: {
                            type: 'number',
                            'x-parser-schema-id': '<anonymous-schema-44>',
                          },
                          quantity: {
                            type: 'number',
                            'x-parser-schema-id': '<anonymous-schema-45>',
                          },
                          side: {
                            type: 'string',
                            enum: ['BUY', 'SELL'],
                            'x-parser-schema-id': '<anonymous-schema-46>',
                          },
                          orderType: {
                            type: 'string',
                            enum: ['LIMIT', 'MARKET'],
                            'x-parser-schema-id': '<anonymous-schema-47>',
                          },
                          status: {
                            type: 'string',
                            'x-parser-schema-id': '<anonymous-schema-48>',
                          },
                        },
                        'x-parser-schema-id': '<anonymous-schema-41>',
                      },
                      'x-parser-schema-id': '<anonymous-schema-40>',
                    },
                  },
                  'x-parser-schema-id': '<anonymous-schema-30>',
                },
                'x-parser-schema-id': '<anonymous-schema-29>',
              },
            },
            required: ['event', 'success', 'data'],
            'x-parser-schema-id': 'TopOrderBookPayload',
          },
          'x-parser-unique-object-id': 'topOrderBook.message',
        },
      },
      'x-parser-unique-object-id': 'getTopOrderBook',
    },
    topOrderBookBroadcast: {
      address: 'topOrderBookBroadcast',
      messages: {
        'topOrderBookBroadcast.message': {
          name: 'TopOrderBookBroadcast',
          title: 'Top OrderBook (Broadcast)',
          summary:
            'Server broadcasts order book updates every 8 seconds for subscribed pairs.\n',
          payload:
            '$ref:$.channels.getTopOrderBook.messages.topOrderBook.message.payload',
          'x-parser-unique-object-id': 'topOrderBookBroadcast.message',
        },
      },
      'x-parser-unique-object-id': 'topOrderBookBroadcast',
    },
  },
  operations: {
    createOrder: {
      action: 'send',
      channel: '$ref:$.channels.createOrder',
      messages: ['$ref:$.channels.createOrder.messages.createOrder.message'],
      'x-parser-unique-object-id': 'createOrder',
    },
    orderCreated: {
      action: 'receive',
      channel: '$ref:$.channels.createOrder',
      messages: ['$ref:$.channels.createOrder.messages.orderCreated.message'],
      'x-parser-unique-object-id': 'orderCreated',
    },
    cancelOrder: {
      action: 'send',
      channel: '$ref:$.channels.cancelOrder',
      messages: ['$ref:$.channels.cancelOrder.messages.cancelOrder.message'],
      'x-parser-unique-object-id': 'cancelOrder',
    },
    orderCancelled: {
      action: 'receive',
      channel: '$ref:$.channels.cancelOrder',
      messages: ['$ref:$.channels.cancelOrder.messages.orderCancelled.message'],
      'x-parser-unique-object-id': 'orderCancelled',
    },
    tradeExecuted: {
      action: 'receive',
      channel: '$ref:$.channels.tradeExecuted',
      messages: [
        '$ref:$.channels.tradeExecuted.messages.tradeExecuted.message',
      ],
      'x-parser-unique-object-id': 'tradeExecuted',
    },
    getTopOrderBook: {
      action: 'send',
      channel: '$ref:$.channels.getTopOrderBook',
      messages: [
        '$ref:$.channels.getTopOrderBook.messages.getTopOrderBook.message',
      ],
      'x-parser-unique-object-id': 'getTopOrderBook',
    },
    topOrderBook: {
      action: 'receive',
      channel: '$ref:$.channels.getTopOrderBook',
      messages: [
        '$ref:$.channels.getTopOrderBook.messages.topOrderBook.message',
      ],
      'x-parser-unique-object-id': 'topOrderBook',
    },
    topOrderBookBroadcast: {
      action: 'receive',
      channel: '$ref:$.channels.topOrderBookBroadcast',
      messages: [
        '$ref:$.channels.topOrderBookBroadcast.messages.topOrderBookBroadcast.message',
      ],
      'x-parser-unique-object-id': 'topOrderBookBroadcast',
    },
  },
  components: {
    schemas: {
      OrderType:
        '$ref:$.channels.createOrder.messages.createOrder.message.payload.oneOf[0].properties.orderType',
      Side: '$ref:$.channels.createOrder.messages.createOrder.message.payload.oneOf[0].properties.side',
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
