# Order Module

The `order` module is a core component of the application responsible for managing order-related functionalities. It handles the creation, cancellation, and fulfillment of orders, interacting seamlessly with the Redis database to maintain the order book and ensure real-time updates.

## Table of Contents

- [Overview](#overview)
- [Components](#components)
  - [Controllers](#controllers)
  - [Data Transfer Objects (DTOs)](#data-transfer-objects-dtos)
  - [Models](#models)
  - [Repositories](#repositories)
  - [Services](#services)
  - [Constants](#constants)
- [Usage](#usage)
- [Best Practices](#best-practices)

## Overview

The `order` module encapsulates all functionalities related to order management within the application. It leverages Redis for data storage and retrieval, ensuring high performance and scalability. The module is structured to promote separation of concerns, making it maintainable and extensible.

## Components

### Controllers

**File:** `controllers/OrderSocketController.js`

**Description:**
Handles real-time Socket.io events related to orders. It listens for incoming events such as `createOrder`, `cancelOrder`, and `fillOrder`, processes them using the service layer, and emits appropriate responses or updates to clients.

**Key Responsibilities:**

- Managing Socket.io connections within the `/order` namespace.
- Handling specific order-related events.
- Emitting responses and updates to clients.

### Data Transfer Objects (DTOs)

**Directory:** `dtos/`

**Files:**

- `createOrderDto.js`
- `cancelOrderDto.js`
- `index.js`

**Description:**
Defines schemas for validating incoming data related to order operations using [Zod](https://github.com/colinhacks/zod). Ensures that the data conforms to expected formats before processing.

**Key Components:**

- **createOrderRequestDto:** Validates data for creating a new order.
- **cancelOrderRequestDto:** Validates data for cancelling an existing order.

### Models

**Directory:** `models/`

**Files:**

- `Order.js`
- `index.js`

**Description:**
Defines the `Order` model representing the structure of an order within the system. It encapsulates order attributes and provides a clear blueprint for order data.

**Key Attributes:**

- `orderId`
- `pair`
- `price`
- `quantity`
- `side`
- `status`

### Repositories

**Directory:** `repositories/`

**File:** `OrderRepository.js`

**Description:**
Manages interactions with the Redis database for order-related operations. It handles CRUD operations, maintains the order book using Redis sorted sets, and ensures data consistency.

**Key Responsibilities:**

- Saving, retrieving, updating, and deleting orders in Redis.
- Managing order books for different trading pairs.
- Handling order status updates.

### Services

**Directory:** `services/`

**File:** `OrderService.js`

**Description:**
Contains the business logic for managing orders. It interacts with the repository layer to perform operations such as creating, cancelling, and filling orders.

**Key Responsibilities:**

- Creating new orders with unique identifiers.
- Cancelling and fulfilling existing orders.
- Fetching top bids and asks for trading pairs.
- Updating order details.

### Constants

**File:** `orderConstants.js`

**Description:**
Defines constant values used within the order module to ensure consistency and avoid magic strings.

**Key Constants:**

- **Sides:** Defines the possible sides of an order (`BUY`, `SELL`).

```javascript
export const Sides = {
  BUY: 'BUY',
  SELL: 'SELL',
};
```

## Usage

1. **Importing the Order Module:**

   ```javascript
   import { OrderSocketController } from './modules/order/controllers/OrderSocketController.js';
   ```

2. **Initializing the Controller with Socket.io:**

   ```javascript
   import { Server } from 'socket.io';
   import { OrderSocketController } from './modules/order/controllers/OrderSocketController.js';
   
   const io = new Server(3000, {
     cors: {
       origin: '*',
       methods: ['GET', 'POST'],
     },
   });
   
   // Initialize Order Socket Controller
   new OrderSocketController(io);
   
   console.log('Socket.io server is running on port 3000');
   ```

3. **Handling Events:**

   The `OrderSocketController` listens to events such as `createOrder`, `cancelOrder`, and `fillOrder`. Ensure that clients emit these events with the correct payload structure as defined by the DTOs.

## Best Practices

- **Separation of Concerns:** Keep controllers, services, and repositories distinct to enhance maintainability and scalability.
- **Validation:** Always validate incoming data using DTOs to prevent malformed or malicious inputs.
- **Consistent Naming:** Use the defined constants for event names and order sides to maintain consistency.
- **Logging:** Leverage the centralized `logger` for all logging needs to ensure uniformity and ease of debugging.
