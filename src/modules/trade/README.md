# 📖 Trade Module

## Overview

The **Trade Module** handles the execution and retrieval of trades within the trading system. It is responsible for:

- **Matching top buy and sell orders** to create a trade.
- **Storing executed trades** in Redis.
- **Retrieving recent trades** for a trading pair.
- **Emitting trade execution events** via WebSocket.

This module ensures that order execution is handled efficiently and supports **real-time trade updates**.

## 📂 Directory Structure

```
trade
├── controllers
│   └── TradeSocketController.js  # Handles WebSocket trade events
├── dtos
│   ├── index.js                  # DTO export handler
│   └── tradePairDto.js            # DTO for matching trades
├── models
│   ├── Trade.js                   # Trade entity definition
│   └── index.js
├── repositories
│   └── TradeRepository.js         # Trade persistence logic (Redis)
├── services
│   └── TradeService.js            # Business logic for trade execution
├── tradeConstants.js              # Enum-like constants for trade status
├── index.js                       # Main module export
└── README.md                      # Documentation
```

## 📌 Key Components

### **1️⃣ Trade Constants (`tradeConstants.js`)**

Defines trade statuses:

```js
export const TradeStatus = {
  OPEN: 'OPEN',
  CANCELLED: 'CANCELLED',
  FILLED: 'FILLED',
};
```

### **2️⃣ Trade Repository (`TradeRepository.js`)**

Handles Redis-based storage of trades:

- **`storeTrade(trade)`** → Stores a new trade.
- **`getTrade(tradeId)`** → Retrieves a trade by ID.
- **`getRecentTrades(pair, limit)`** → Fetches recent trades for a pair.

### **3️⃣ Trade Service (`TradeService.js`)**

Implements trade-related business logic:

- **`matchTopOrders(pair)`** → Matches top bid and ask for a pair to create a trade.
- **`getRecentTrades(pair, limit)`** → Retrieves recent trades from Redis.

### **4️⃣ Trade WebSocket Controller (`TradeSocketController.js`)**

Manages WebSocket event handling using **Socket.IO namespaces**:

- Listens for events:
  - `matchTopOrders`
  - `getRecentTrades`
- Emits trade updates to clients.

## 📡 WebSocket Events

### **📤 Client → Server Events**

| Event Name        | Payload Schema     | Description                     |
| ----------------- | ------------------ | ------------------------------- |
| `matchTopOrders`  | `{ pair }`         | Matches top buy and sell orders |
| `getRecentTrades` | `{ pair, limit? }` | Retrieves recent trades         |

### **📥 Server → Client Events**

| Event Name      | Payload Schema                                                    | Description                       |
| --------------- | ----------------------------------------------------------------- | --------------------------------- |
| `noTrade`       | `{ event: "noTrade", message: "No matching orders", data: pair }` | No trade was executed             |
| `tradeExecuted` | `{ event: "tradeExecuted", data: trade }`                         | A trade was successfully executed |
| `recentTrades`  | `{ event: "recentTrades", data: { pair, trades } }`               | Response with recent trades       |

## 🎯 Future Enhancements

- **Improve order matching** to support partial fills.
- **Integrate trade analytics** to provide historical trade insights.
- **Enhance security measures** to prevent manipulation.
