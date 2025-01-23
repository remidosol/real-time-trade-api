# 📖 Order Module

## Overview

The **Order Module** manages real-time order handling in the trading system. It provides WebSocket-based APIs for **creating, canceling, and filling orders**, and efficiently maintains the order book using **Redis**.

This module ensures:

- Real-time order processing.
- Efficient order book management with **Redis Sorted Sets**.
- Event-driven communication through **Socket.IO**.
- Strict **DTO-based validation** for incoming requests.

## 📂 Directory Structure

```
order
├── controllers
│   └── OrderSocketController.js  # Handles WebSocket events
├── dtos
│   ├── cancelOrderDto.js         # DTO for canceling an order
│   ├── createOrderDto.js         # DTO for creating an order
│   └── index.js                  # DTO export handler
├── models
│   ├── Order.js                  # Order entity definition
│   └── index.js                   
├── repositories
│   └── OrderRepository.js         # Order persistence logic (Redis)
├── services
│   └── OrderService.js            # Business logic for order management
├── orderConstants.js              # Enum-like constants (BUY, SELL)
├── index.js                       # Main module export
└── README.md                      # Documentation
```

## 🚀 Order Flow

1. **Client** sends an event (`createOrder`, `cancelOrder`, `fillOrder`) via **Socket.IO**.
2. **Controller (`OrderSocketController.js`)** validates the request and routes it to the service.
3. **Service (`OrderService.js`)** processes the request, generates an order ID (if needed), and interacts with the repository.
4. **Repository (`OrderRepository.js`)** stores order data in **Redis** (using Sorted Sets for order book management).
5. **Order updates are broadcasted** to subscribed clients for real-time trading updates.

## 📌 Key Components

### **1️⃣ Order Constants**

Defined in [`orderConstants.js`](./orderConstants.js):

```js
export const Sides = {
  BUY: 'BUY',
  SELL: 'SELL',
};
```

### **2️⃣ Order Repository (`OrderRepository.js`)**

Handles Redis-based storage of orders:

- **`saveOrder(order)`** → Stores an order in Redis Hash.
- **`deleteOrder(order)`** → Removes order from Redis.
- **`getOrder(orderId)`** → Fetches order details.
- **`addOrder(order)`** → Adds order to order book (Sorted Sets).
- **`removeOrder(order)`** → Removes order from order book.
- **`getTopBids(pair, limit)`** → Retrieves highest buy orders.
- **`getTopAsks(pair, limit)`** → Retrieves lowest sell orders.

### **3️⃣ Order Service (`OrderService.js`)**

Implements order-related business logic:

- **`createOrder(data)`** → Creates a new order.
- **`cancelOrder(orderId)`** → Cancels an order.
- **`fillOrder(orderId)`** → Marks order as filled.
- **`updateOrder(orderId, data)`** → Updates order fields.

### **4️⃣ Order WebSocket Controller (`OrderSocketController.js`)**

Manages WebSocket event handling using **Socket.IO**:

- Listens for events:
  - `createOrder`
  - `cancelOrder`
  - `fillOrder`
- Emits updates to clients:
  - `orderCreated`
  - `orderCancelled`
  - `orderFilled`
- Validates incoming data with DTOs.

### **5️⃣ Data Validation (DTOs)**

Defined using **Zod** in `dtos/`:

```js
export const CreateOrderRequestDto = z.object({
  pair: z.enum(['BTC-USD', 'ETH-USD']),
  side: z.enum(['BUY', 'SELL']),
  price: z.number().positive(),
  quantity: z.number().positive(),
});
```

## 📡 WebSocket Events

### **📤 Client → Server Events**

| Event Name       | Payload Schema            | Description                 |
|-----------------|--------------------------|-----------------------------|
| `createOrder`   | `{ pair, side, price, quantity }` | Creates a new order.      |
| `cancelOrder`   | `{ orderId }`             | Cancels an existing order.  |
| `fillOrder`     | `{ orderId }`             | Marks order as filled.      |

### **📥 Server → Client Events**

| Event Name        | Payload Schema             | Description                     |
|------------------|--------------------------|---------------------------------|
| `orderCreated`  | `{ orderId, pair, ... }`  | A new order has been created.  |
| `orderCancelled`| `{ orderId, status }`     | Order was successfully canceled. |
| `orderFilled`   | `{ orderId, status }`     | Order was successfully filled.  |

## 🎯 Future Enhancements

- **Order Matching Engine** for auto-executing trades.
- **Database Persistence** for long-term order storage.
- **User Authentication** for order authorization.
