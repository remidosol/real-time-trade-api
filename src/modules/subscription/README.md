# 📖 Subscription Module

## Overview

The **Subscription Module** handles WebSocket-based real-time subscriptions to order book updates. It allows clients to:

- **Subscribe** to specific trading pairs.
- **Unsubscribe** from trading pairs.
- **Retrieve top bids/asks** for subscribed trading pairs.

This module ensures efficient real-time updates using **Socket.IO namespaces** and **room-based subscriptions**.

## 📂 Directory Structure

```
subscription
├── controllers
│   └── SubscriptionSocketController.js  # Handles WebSocket subscription events
├── dtos
│   ├── index.js                        # DTO export handler
│   ├── subscriptionPairDto.js          # DTO for subscribing to pairs
│   └── topOrderDto.js                   # DTO for retrieving top order book
├── index.js                             # Module export
└── README.md                            # Documentation
```

## 📌 Key Components

### **1️⃣ Subscription DTOs (`dtos/`)**

Defines **schema-based validation** for incoming subscription-related events using **Zod**.

#### **🔹 SubscriptionPairRequestDto (`subscriptionPairDto.js`)**

```js
export const SubscriptionPairRequestDto = z.object({
  pair: z.enum(Object.values(SupportedPairs), {
    message: `pair property should be one of these values: ${Object.values(SupportedPairs)}`,
  }),
  limit: z
    .number({ message: 'limit must be number' })
    .positive('limit must be positive')
    .optional(),
});
```

#### **🔹 TopOrderRequestDto (`topOrderDto.js`)**

```js
export const topOrderRequestDto = z.object({
  limit: z
    .number({ message: 'limit must be number' })
    .positive('limit must be positive')
    .optional(),
});
```

### **2️⃣ Subscription WebSocket Controller (`SubscriptionSocketController.js`)**

Manages WebSocket event handling using **Socket.IO namespaces and rooms**:

- Listens for events:
  - `subscribePair` → Subscribes a client to a trading pair.
  - `unsubscribePair` → Unsubscribes a client from a trading pair.
  - `getTopOrderBook` → Retrieves the top N bids and asks.
- Uses **Socket.IO rooms** to group subscribers by trading pair.
- Emits updates to subscribed clients.

#### **🔹 Subscription Logic**

- Clients **join a room** corresponding to a trading pair when subscribing.
- Clients **leave the room** when unsubscribing.
- When an order book update occurs, only **clients in the relevant rooms** receive updates.

#### **🔹 Subscription Event Handling**

```js
socket.on(IncomingEventNames.SUBSCRIBE_PAIR, (data) =>
  this.handleSubscribePair(socket, data),
);

socket.on(IncomingEventNames.UNSUBSCRIBE_PAIR, async (data) =>
  this.handleUnsubscribePair(socket, data),
);

socket.on(IncomingEventNames.GET_TOP_ORDER_BOOK, async (data) =>
  this.handleGetTopOrderBook(socket, data),
);
```

#### **🔹 Subscription Room Management**

```js
async handleSubscribePair(socket, data) {
  await socket.join(data.pair);
  socket.emit(OutgoingEventNames.SUBSCRIBED, {
    success: true,
    message: `Subscribing to ${data.pair} pair is successful`
  });
}

async handleUnsubscribePair(socket, data) {
  await socket.leave(data.pair);
  socket.emit(OutgoingEventNames.UNSUBSCRIBED, {
    success: true,
    message: `Unsubscribing to ${data.pair} pair is successful`
  });
}
```

## 📡 WebSocket Events

### **📤 Client → Server Events**

| Event Name        | Payload Schema            | Description                              |
|------------------|--------------------------|------------------------------------------|
| `subscribePair`  | `{ pair }`                | Subscribe to order book updates         |
| `unsubscribePair`| `{ pair }`                | Unsubscribe from order book updates     |
| `getTopOrderBook` | `{ limit? }`             | Retrieve top N bids and asks            |

### **📥 Server → Client Events**

| Event Name         | Payload Schema                           | Description                              |
|-------------------|--------------------------------------|------------------------------------------|
| `subscribed`     | `{ success, message }` | Confirmation of successful subscription |
| `unsubscribed`   | `{ success, message }` | Confirmation of successful unsubscription |
| `topOrderBook`   | `{ event: "topOrderBook", success, data: { ETH_USD: { bids, asks } } }` | Response with top order book data       |

## 🎯 Future Enhancements

- **Implement persistence layer** for long-term subscription tracking.
- **Enhance filtering options** for clients to customize data streams.
- **Optimize Redis event propagation** for lower latency updates.
