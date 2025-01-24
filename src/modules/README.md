# 📖 Modules Overview

## Overview

The `src/modules` directory contains the core functional modules of the **Real-Time Trading API**. Each module is responsible for a specific domain, ensuring a **modular, scalable, and maintainable** architecture. Below is a summary of each module and its purpose.

## 📂 Modules Summary

### **1️⃣ Order Module (`order/`)**

Handles order creation, management, and order book operations.

- **Components:**
  - **Order Repository** → Stores and retrieves orders from Redis.
  - **Order Service** → Business logic for order processing.
  - **Order Socket Controller** → WebSocket event handling for order creation, cancellation, and fulfillment.
  - **DTOs** → Input validation for order operations.
- **Key Events:**
  - `createOrder`, `cancelOrder`, `orderBookUpdate`

### **2️⃣ Trade Module (`trade/`)**

Responsible for matching buy/sell orders and executing trades.

- **Components:**
  - **Trade Repository** → Stores trade history in Redis.
  - **Trade Service** → Matches top bid/ask orders.
  - **Trade Socket Controller** → WebSocket event handling for trade execution and recent trades.
  - **DTOs** → Validation for trade-related requests.
- **Key Events:**
  - `matchTopOrders`, `tradeExecuted`, `getRecentTrades`

### **3️⃣ Subscription Module (`subscription/`)**

Manages WebSocket subscriptions to order book and trade updates.

- **Components:**
  - **Subscription Socket Controller** → Manages real-time subscriptions via WebSocket rooms.
  - **DTOs** → Validation for subscription requests.
- **Key Events:**
  - `subscribePair`, `unsubscribePair`, `topOrderBook`

### **4️⃣ Events Module (`events/`)**

Defines standardized event names and validation schemas for WebSocket events.

- **Components:**
  - **Event Constants** → Defines incoming, outgoing, and error event names.
  - **Validation Schemas** → Zod-based validation for event payloads.
- **Purpose:**
  - Ensures consistent event structure across the system.
  - Provides centralized validation logic.

### **5️⃣ Core Module (`core/`)** *(Shared utilities and configurations)*

Contains common functionality and infrastructure for the system.

- **Logger** → Winston-based logging for structured logging.
- **Redis Client** → Singleton Redis connection manager.
- **Middleware** → Shared middlewares for validation, error handling, and logging.

## 🎯 Future Enhancements

- **Optimize Redis queries** for performance improvements.
- **Implement authentication** for secure WebSocket connections.
- **Enhance real-time analytics** with historical trade data visualization.
