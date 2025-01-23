# Subscription Module

The `subscription` module manages client subscriptions to specific trading pairs, enabling real-time updates and interactions related to those pairs. It ensures that clients receive the latest order book data and can efficiently manage their subscriptions through Socket.io events.

## Table of Contents

- [Overview](#overview)
- [Components](#components)
  - [Controllers](#controllers)
  - [Data Transfer Objects (DTOs)](#data-transfer-objects-dtos)
- [Usage](#usage)
- [Best Practices](#best-practices)

## Overview

The `subscription` module facilitates real-time subscription management for trading pairs. Clients can subscribe or unsubscribe to specific pairs, and request the top orders for those pairs. This module leverages Socket.io for real-time communication and ensures data integrity through rigorous validation using Zod schemas.

## Components

### Controllers

**File:** `controllers/SubscriptionSocketController.js`

**Description:**

Handles Socket.io events related to subscription management. It listens for events such as `subscribePair`, `unsubscribePair`, and `getTopOrderBook`, processes these requests using the service layer, and emits appropriate responses or updates to clients.

**Key Responsibilities:**

- **Managing Subscriptions:** Allows clients to subscribe or unsubscribe from specific trading pairs.
- **Fetching Order Books:** Provides clients with the top N bids and asks for a given trading pair.
- **Error Handling:** Emits standardized error responses in case of validation failures or operational issues.

**Usage:**

```javascript
import { Server } from 'socket.io';
import { SubscriptionSocketController } from './controllers/SubscriptionSocketController.js';

const io = new Server(3000, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Initialize Subscription Socket Controller
new SubscriptionSocketController(io);

console.log('Socket.io server is running on port 3000');
```

### Data Transfer Objects (DTOs)

**Directory:** `dtos/`

**Files:**

- `subscriptionPairDto.js`
- `index.js`

**Description:**

Defines schemas for validating incoming data related to subscription events using [Zod](https://github.com/colinhacks/zod). Ensures that the data received from clients adheres to the expected structure and types, enhancing reliability and security.

**Key Components:**

- **subscriptionPairRequestDto:** Validates data for subscribing or unsubscribing to a trading pair.

**Example:**

```javascript
// dtos/subscriptionPairDto.js

import { z } from 'zod';
import { SupportedPairs } from '../../../core/globalConstants.js';

export const subscriptionPairRequestDto = z.object({
  pair: z.enum(Object.values(SupportedPairs), {
    message: `pair property should be one of these values: ${Object.values(SupportedPairs)}`,
  }),
  limit: z
    .number({ message: 'limit must be number' })
    .positive('limit must be positive')
    .optional(),
});
```

**Usage:**

The DTOs are integrated within the middleware to automatically validate incoming Socket.io events.

```javascript
import { socketDtoMiddleware } from '../../../core/middlewares/validateSocket.js';
import { EventSchemas } from '../../events/validationSchemas.js';
import { Server } from 'socket.io';

const io = new Server(3000);

// Apply validation middleware
io.of('/subscription').use(socketDtoMiddleware(EventSchemas));

// Initialize Subscription Socket Controller
new SubscriptionSocketController(io);
```

## Usage

1. **Importing the Subscription Module:**

   ```javascript
   import { SubscriptionSocketController } from './modules/subscription/controllers/SubscriptionSocketController.js';
   ```

2. **Initializing with Socket.io:**

   ```javascript
   import { Server } from 'socket.io';
   import { SubscriptionSocketController } from './modules/subscription/controllers/SubscriptionSocketController.js';
   
   const io = new Server(3000, {
     cors: {
       origin: '*',
       methods: ['GET', 'POST'],
     },
   });
   
   // Initialize Subscription Socket Controller
   new SubscriptionSocketController(io);
   
   console.log('Socket.io server is running on port 3000');
   ```

3. **Client-Side Interaction:**

   - **Subscribe to a Pair:**

     ```javascript
     socket.emit(IncomingEventNames.SUBSCRIBE_PAIR, { pair: SupportedPairs.BTC_USD, limit: 10 });
     ```

   - **Unsubscribe from a Pair:**

     ```javascript
     socket.emit(IncomingEventNames.UNSUBSCRIBE_PAIR, { pair: SupportedPairs.BTC_USD });
     ```

   - **Request Top Order Book:**

     ```javascript
     socket.emit(IncomingEventNames.GET_TOP_ORDER_BOOK, { pair: SupportedPairs.BTC_USD, limit: 5 });
     ```

4. **Handling Server Responses:**

   Listen for events such as `subscribed`, `unsubscribed`, and `topOrderBook` to receive updates.

   ```javascript
   socket.on(OutgoingEventNames.SUBSCRIBED, (response) => {
     console.log('Subscribed:', response);
   });
   
   socket.on(OutgoingEventNames.UNSUBSCRIBED, (response) => {
     console.log('Unsubscribed:', response);
   });
   
   socket.on(OutgoingEventNames.TOP_ORDER_BOOK, (data) => {
     console.log('Top Order Book:', data);
   });
   
   socket.on(ErrorEventNames.SUBSCRIPTION_ERROR, (error) => {
     console.error('Subscription Error:', error);
   });
   ```

## Best Practices

- **Consistent Validation:** Always use the defined DTOs to validate incoming data, preventing malformed or malicious inputs.
- **Error Handling:** Utilize the standardized error responses to provide clear feedback to clients and facilitate easier debugging.
- **Modular Architecture:** Maintain separation of concerns by keeping controllers, DTOs, and services distinct, enhancing code maintainability.
- **Logging:** Leverage the centralized `logger` to record significant events and errors, aiding in monitoring and troubleshooting.
- **Resource Management:** Ensure that clients properly unsubscribe from trading pairs to manage server resources effectively and prevent unnecessary data transmission.
- **Scalability:** Design the subscription logic to handle a large number of concurrent subscriptions efficiently, leveraging Redis and Socket.io optimally.
