# 🛒 Order Module

## Overview

The **Order Module** is responsible for handling order creation, cancellation, and execution within the trading system. It supports **LIMIT** and **MARKET** orders and ensures efficient order matching using Redis Sorted Sets.

## Features

- **Order Types**: Supports both **LIMIT** and **MARKET** orders.
- **Order Management**: Create, cancel, update, and execute orders.
- **Order Book**: Uses Redis Sorted Sets for efficient price-based sorting.
- **Partial Fills**: Ensures trades are partially filled if liquidity is insufficient.
- **WebSocket Integration**: Emits real-time updates on order events.

## Order Types

### 🔹 **LIMIT Order**

- Placed at a **specific price**.
- Stored in the order book until matched.
- Sorted **descending for bids** (BUY) and **ascending for asks** (SELL).

### 🔹 **MARKET Order**

- Executed **immediately** at the best available price.
- Matches with existing LIMIT orders.
- Supports **partial fills** if liquidity is insufficient.

## Key Components

### 📂 **Directory Structure**

```
order/
├── controllers/
│   └── OrderSocketController.js  # WebSocket controller for order events
├── dtos/
│   ├── cancelOrderDto.js         # DTO for cancel order validation
│   ├── createOrderDto.js         # DTO for create order validation
│   └── index.js
├── models/
│   ├── Order.js                  # Order model with attributes
│   └── index.js
├── repositories/
│   └── OrderRepository.js        # Redis-based order persistence
├── services/
│   └── OrderService.js           # Order processing & matching logic
├── orderConstants.js             # Constants for order types & trade statuses
├── README.md                     # Documentation for Order Module
├── index.js                      # Module entry point
```

### 📌 **Order Model** (`Order.js`)

```javascript
export class Order {
  constructor({ orderId, pair, price, quantity, side, status, orderType }) {
    this.orderId = orderId;
    this.pair = pair;
    this.price = price;
    this.quantity = quantity;
    this.side = side;
    this.status = status; // OPEN, FILLED, CANCELLED
    this.orderType = orderType; // LIMIT, MARKET
  }
}
```

### 🔧 **Order Service** (`OrderService.js`)

Handles **order creation, matching, execution, and cancellation**.

#### ✅ **Order Processing Logic**

- **LIMIT Orders** → Stored in Redis Sorted Sets until matched.
- **MARKET Orders** → Matched immediately against the best available limit orders.
- **Partial Fills** → If liquidity is insufficient, only part of the order executes.

### 📡 **WebSocket Events** (`OrderSocketController.js`)

| Event Name       | Type      | Description |
|-----------------|----------|-------------|
| `createOrder`   | Client → Server | Creates a new order. |
| `orderCreated`  | Server → Client | Broadcasts when an order is created. |
| `cancelOrder`   | Client → Server | Cancels an existing order. |
| `orderCancelled`| Server → Client | Broadcasts when an order is canceled. |
| `fillOrder`     | Client → Server | Executes an order manually. |
| `orderFilled`   | Server → Client | Broadcasts when an order is filled. |
| `orderBookUpdate` | Server → Client | Notifies subscribers when order book changes. |

### 📜 **Example WebSocket Payloads**

#### ✅ **Creating a LIMIT Order**

```json
{
  "pair": "ETH_USD",
  "price": 2500,
  "quantity": 2,
  "side": "BUY",
  "orderType": "LIMIT"
}
```

#### ✅ **Creating a MARKET Order**

```json
{
  "pair": "ETH_USD",
  "quantity": 3,
  "side": "SELL",
  "orderType": "MARKET"
}
```

#### ✅ **Server Response: Order Created**

```json
{
  "event": "orderCreated",
  "success": true,
  "data": {
    "orderId": "12345-xyz",
    "pair": "ETH_USD",
    "price": 2500,
    "quantity": 2,
    "side": "BUY",
    "status": "OPEN",
    "orderType": "LIMIT"
  }
}
```

## Summary

- **High-performance order management** with Redis Sorted Sets.
- **Efficient real-time updates** via WebSocket events.
- **Flexible order types** supporting both LIMIT and MARKET orders.
- **Scalable architecture** optimized for trading platforms.

**📌 Related Modules:**

- **[Trade Module](../trade/README.md)** → Handles trade execution.
- **[Subscription Module](../subscription/README.md)** → Real-time order book updates.

🚀 **This module ensures seamless order execution and high-frequency trading support!**
