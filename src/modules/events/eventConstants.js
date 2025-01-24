export const IncomingEventNames = {
  CREATE_ORDER: 'createOrder',
  CANCEL_ORDER: 'cancelOrder',
  FILL_ORDER: 'fillOrder',
  SUBSCRIBE_PAIR: 'subscribePair',
  UNSUBSCRIBE_PAIR: 'unsubscribePair',
  GET_TOP_ORDER_BOOK: 'getTopOrderBook',
  MATCH_TOP_ORDERS: 'matchTopOrders',
  GET_RECENT_TRADES: 'getRecentTrades',
};

export const OutgoingEventNames = {
  ORDER_CREATED: 'orderCreated',
  ORDER_CANCELLED: 'orderCancelled',
  ORDER_FILLED: 'orderFilled',
  ORDER_BOOK_UPDATE: 'orderBookUpdate',
  SUBSCRIBED: 'subscribed',
  UNSUBSCRIBED: 'unsubscribed',
  TOP_ORDER_BOOK: 'topOrderBook',
  NO_TRADE: 'noTrade',
  TRADE_EXECUTED: 'tradeExecuted',
  RECENT_TRADES: 'recentTrades',
  TRADE_UPDATE: 'tradeUpdate',
};

export const ErrorEventNames = {
  ORDER_ERROR: 'orderError',
  ORDER_BOOK_ERROR: 'orderBookError',
  GATEWAY_ERROR: 'gatewayError',
  SUBSCRIPTION_ERROR: 'subscriptionError',
  TRADE_ERROR: 'tradeError',
  VALIDATION_ERROR: 'validationError',
};
