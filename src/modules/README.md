# Modules Overview

The `src/modules` directory encapsulates the core functionalities of the application, organizing related components into distinct, maintainable modules. Each module is responsible for a specific domain, promoting separation of concerns and enhancing the scalability of the application. Below is a summary of each module within the `src/modules` directory.

## Table of Contents

- [Events Module](#events-module)
- [Order Module](#order-module)
- [Subscription Module](#subscription-module)
- [Trade Module](#trade-module)

## Events Module

**Path:** `src/modules/events`

**Overview:**
The `events` module centralizes the definition and management of event names and their corresponding validation schemas used throughout the application. It ensures a consistent and reliable communication protocol between the server and clients, particularly when handling real-time interactions with Socket.io.

**Key Components:**

- **Event Constants (`eventConstants.js`):** Defines standardized event names categorized into incoming, outgoing, and error events to maintain uniformity across the application.
  
- **Validation Schemas (`validationSchemas.js`):** Utilizes [Zod](https://github.com/colinhacks/zod) to validate incoming event payloads, ensuring data integrity and preventing malformed or malicious inputs.

**Usage:**
Modules leverage the event constants and validation schemas to handle real-time events efficiently. This setup facilitates seamless integration with Socket.io, enabling robust and secure event-driven communication.

## Order Module

**Path:** `src/modules/order`

**Overview:**
The `order` module is responsible for managing all order-related functionalities within the application. It handles the creation, cancellation, and fulfillment of orders, interacting with the Redis database to maintain the order book and ensure real-time updates.

**Key Components:**

- **Controllers (`controllers/OrderSocketController.js`):** Manages Socket.io events related to orders, processing client requests and emitting appropriate responses.
  
- **Data Transfer Objects (DTOs) (`dtos/`):** Defines schemas for validating incoming data related to order operations using [Zod](https://github.com/colinhacks/zod).
  
- **Models (`models/Order.js`):** Represents the structure of an order, encapsulating its attributes and providing a clear blueprint for order data.
  
- **Repositories (`repositories/OrderRepository.js`):** Handles interactions with the Redis database for storing, retrieving, updating, and deleting orders.
  
- **Services (`services/OrderService.js`):** Contains the business logic for managing orders, orchestrating operations such as creating, cancelling, and filling orders.
  
- **Constants (`orderConstants.js`):** Defines constant values used within the order module to ensure consistency and avoid magic strings.

**Usage:**
The module interacts with other parts of the application through its well-defined interfaces, ensuring that order management is handled efficiently and reliably. Controllers listen for real-time events, services process the business logic, and repositories manage data persistence.

## Subscription Module

**Path:** `src/modules/subscription`

**Overview:**
The `subscription` module manages client subscriptions to specific trading pairs, enabling real-time updates and interactions related to those pairs. It ensures that clients receive the latest order book data and can efficiently manage their subscriptions through Socket.io events.

**Key Components:**

- **Controllers (`controllers/SubscriptionSocketController.js`):** Handles Socket.io events related to subscription management, such as subscribing or unsubscribing from trading pairs and requesting top order book data.
  
- **Data Transfer Objects (DTOs) (`dtos/subscriptionPairDto.js`):** Defines schemas for validating incoming data related to subscription events using [Zod](https://github.com/colinhacks/zod).

**Usage:**
Clients interact with the subscription module by emitting events to subscribe or unsubscribe from trading pairs. The controller processes these requests, manages room memberships in Socket.io, and ensures that clients receive real-time updates relevant to their subscriptions.

## Trade Module

**Path:** `src/modules/trade`

**Overview:**
The `trade` module is a pivotal component responsible for managing trade-related functionalities. It handles the execution of trades by matching orders, maintaining trade records, and providing real-time updates to clients. This module ensures efficient and reliable trade processing, leveraging Redis for data storage and Socket.io for real-time communication.

**Key Components:**

- **Controllers (`controllers/TradeSocketController.js`):** Manages Socket.io events related to trades, including matching top orders and retrieving recent trade data.
  
- **Data Transfer Objects (DTOs) (`dtos/tradePairDto.js`):** Defines schemas for validating incoming trade-related data using [Zod](https://github.com/colinhacks/zod).
  
- **Models (`models/Trade.js`):** Represents the structure of a trade, encapsulating its attributes and providing a clear blueprint for trade data.
  
- **Repositories (`repositories/TradeRepository.js`):** Handles interactions with the Redis database for storing and retrieving trade records.
  
- **Services (`services/TradeService.js`):** Contains the business logic for executing trades, including matching orders and managing trade records.
  
- **Constants (`tradeConstants.js`):** Defines constant values used within the trade module to ensure consistency and avoid magic strings.

**Usage:**
The trade module facilitates the core trading operations by matching buy and sell orders, executing trades, and broadcasting trade information to subscribed clients. Controllers listen for trade-related events, services handle the execution logic, and repositories manage data persistence.

## Usage

Each module within the `src/modules` directory is designed to operate independently while seamlessly integrating with other modules to provide comprehensive functionality. Here's how to utilize these modules effectively:

1. **Initialize Socket.io Controllers:**

   For each module that interacts with Socket.io (e.g., Order, Subscription, Trade), initialize their respective socket controllers with the Socket.io server instance.

   ```javascript
   import { Server } from 'socket.io';
   import { OrderSocketController } from './modules/order/controllers/OrderSocketController.js';
   import { SubscriptionSocketController } from './modules/subscription/controllers/SubscriptionSocketController.js';
   import { TradeSocketController } from './modules/trade/controllers/TradeSocketController.js';
   
   const io = new Server(3000, {
     cors: {
       origin: '*',
       methods: ['GET', 'POST'],
     },
   });
   
   // Initialize Controllers
   new OrderSocketController(io);
   new SubscriptionSocketController(io);
   new TradeSocketController(io);
   
   console.log('Socket.io server is running on port 3000');
   ```

2. **Client-Side Interaction:**

   Clients can interact with the server by emitting events defined in the `events` module. Ensure that the payloads conform to the schemas defined in the respective DTOs.

   ```javascript
   // Example: Subscribing to a Trading Pair
   socket.emit('subscribePair', { pair: 'BTC_USD', limit: 10 });
   
   // Example: Creating an Order
   socket.emit('createOrder', {
     pair: 'BTC_USD',
     side: 'BUY',
     price: 45000,
     quantity: 1.5,
   });
   
   // Example: Matching Top Orders
   socket.emit('matchTopOrders', { pair: 'BTC_USD' });
   ```

3. **Handling Responses:**

   Listen for events emitted by the server to handle responses and updates.

   ```javascript
   socket.on('orderCreated', (response) => {
     console.log('Order Created:', response);
   });
   
   socket.on('subscribed', (response) => {
     console.log('Subscribed:', response);
   });
   
   socket.on('tradeExecuted', (response) => {
     console.log('Trade Executed:', response);
   });
   
   socket.on('error', (error) => {
     console.error('Error:', error);
   });
   ```

## Best Practices

- **Separation of Concerns:** Maintain clear boundaries between controllers, services, repositories, and models to enhance code maintainability and scalability.
  
- **Consistent Validation:** Utilize DTOs and validation middleware across all modules to ensure incoming data adheres to expected formats, preventing errors and enhancing security.
  
- **Standardized Error Handling:** Implement centralized error handling using the `ApiError` class and error-handling middleware to provide consistent and informative error responses.
  
- **Efficient Logging:** Leverage the centralized `logger` for all logging needs to ensure uniformity, ease of debugging, and effective monitoring of application behavior.
  
- **Modular Architecture:** Design each module to be self-contained yet interoperable, facilitating easier updates and scalability as the application grows.
  
- **Resource Management:** Ensure that Socket.io connections are properly managed, and resources are released when clients disconnect to prevent memory leaks and optimize performance.
  
- **Documentation:** Keep module documentation up-to-date to assist developers in understanding module functionalities, usage patterns, and integration points.

For detailed information about each module, refer to their respective `README.md` files located within their directories.
