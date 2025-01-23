# 📖 Events Module

## Overview

The **Events Module** defines all WebSocket event names, event validation schemas, and error event names used across the trading system. It ensures a structured and standardized event-driven communication mechanism.

This module is responsible for:

- Maintaining **consistent event names** across the system.
- **Validating** incoming event payloads using predefined schemas.
- Handling **error event names** to provide better debugging and client feedback.

## 📂 Directory Structure

```
events
├── eventConstants.js        # Defines incoming, outgoing, and error event names
├── validationSchemas.js     # Defines event validation schemas
├── index.js                 # Module export handler
└── README.md                # Documentation
```

## 📌 Key Components

### **1️⃣ Event Constants (`eventConstants.js`)**

Defines the **event names** used in WebSocket communication.

#### **🔹 Incoming Events (Client → Server)**

| Event Name             | Description                                |
|-----------------------|--------------------------------------------|
| `createOrder`         | Create a new order                        |
| `cancelOrder`         | Cancel an existing order                  |
| `fillOrder`           | Fill an order (execute trade)             |
| `subscribePair`       | Subscribe to order book updates           |
| `unsubscribePair`     | Unsubscribe from order book updates       |
| `getTopOrderBook`     | Get the top N orders from the order book  |
| `matchTopOrders`      | Match the highest bid with the lowest ask |
| `getRecentTrades`     | Retrieve recent trade history             |

#### **🔹 Outgoing Events (Server → Client)**

| Event Name          | Description                                |
|--------------------|--------------------------------------------|
| `orderCreated`     | Order was successfully created             |
| `orderCancelled`   | Order was successfully cancelled           |
| `orderFilled`      | Order was executed (fully or partially)    |
| `orderBookUpdate`  | Order book was updated                     |
| `subscribed`       | Successfully subscribed to a trading pair  |
| `unsubscribed`     | Successfully unsubscribed                  |
| `topOrderBook`     | Response to `getTopOrderBook` request      |
| `noTrade`          | No trade was matched                       |
| `tradeExecuted`    | Trade execution event                      |
| `recentTrades`     | Response to `getRecentTrades` request      |
| `tradeUpdate`      | Realtime trade update                      |

#### **🔹 Error Events**

| Event Name            | Description                        |
|----------------------|------------------------------------|
| `orderError`        | General error related to orders   |
| `orderBookError`    | Issue fetching order book         |
| `gatewayError`      | WebSocket gateway error           |
| `subscriptionError` | Subscription-related error        |
| `tradeError`        | Trade-related error               |
| `validationError`   | Schema validation failure         |

### **2️⃣ Event Validation (`validationSchemas.js`)**

Defines **schema-based validation** for all incoming WebSocket events using **Zod**.

#### **🔹 Event Validation Mapping**

Maps **incoming event names** to their corresponding validation schemas:

```js
export const EventSchemas = {
  [IncomingEventNames.CREATE_ORDER]: createOrderRequestDto,
  [IncomingEventNames.CANCEL_ORDER]: cancelOrderRequestDto,
  [IncomingEventNames.FILL_ORDER]: cancelOrderRequestDto,
  [IncomingEventNames.SUBSCRIBE_PAIR]: subscriptionPairRequestDto,
  [IncomingEventNames.UNSUBSCRIBE_PAIR]: subscriptionPairRequestDto,
  [IncomingEventNames.GET_TOP_ORDER_BOOK]: topOrderRequestDto,
  [IncomingEventNames.MATCH_TOP_ORDERS]: tradePairRequestDto,
  [IncomingEventNames.GET_RECENT_TRADES]: tradePairRequestDto,
};
```

#### **🔹 Validation Function**

Provides a utility function to validate event payloads dynamically:

```js
export const isValidationSuccess = (event, data) => {
  return EventSchemas[event]
    ? EventSchemas[event].safeParse(data).success
    : true;
};
```

This ensures only correctly formatted data is processed while preventing malformed requests from disrupting the system.

## 🎯 Future Enhancements

- **Expand event handling** to include more granular trade updates.
- **Improve error handling** by categorizing and logging validation failures.
- **Enhance event security** with authentication checks before allowing subscriptions.
