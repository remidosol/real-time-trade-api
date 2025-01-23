# Events Module

The `events` module is responsible for defining and managing the various event names and their corresponding validation schemas used throughout the application. This ensures a consistent and reliable communication protocol between the server and clients, especially when handling real-time interactions with Socket.io.

## Table of Contents

- [Overview](#overview)
- [Components](#components)
  - [Event Constants (`eventConstants.js`)](#event-constants-eventconstantsjs)
  - [Validation Schemas (`validationSchemas.js`)](#validation-schemas-validationschemasjs)
- [Usage](#usage)
- [Best Practices](#best-practices)

## Overview

The `events` module centralizes the definition of event names and their validation logic. By standardizing event names and payload structures, it promotes consistency and reduces the likelihood of errors during client-server communication. This module is particularly crucial for applications leveraging real-time technologies like Socket.io.

## Components

### Event Constants (`eventConstants.js`)

**Purpose:**

Defines standardized event names categorized into incoming, outgoing, and error events. This categorization helps in organizing and managing different types of events effectively.

**Key Components:**

- **IncomingEventNames:** Events initiated by the client to the server.
- **OutgoingEventNames:** Events emitted by the server to the client.
- **ErrorEventNames:** Events used to communicate errors from the server to the client.

**Example:**

```javascript
export const IncomingEventNames = {
  CREATE_ORDER: 'createOrder',
  CANCEL_ORDER: 'cancelOrder',
  // ... other incoming events
};

export const OutgoingEventNames = {
  ORDER_CREATED: 'orderCreated',
  ORDER_CANCELLED: 'orderCancelled',
  // ... other outgoing events
};

export const ErrorEventNames = {
  ORDER_ERROR: 'orderError',
  VALIDATION_ERROR: 'validationError',
  // ... other error events
};
```

**Usage:**

Import and use these constants to ensure consistent event naming across the application.

```javascript
import { IncomingEventNames } from './eventConstants.js';

socket.on(IncomingEventNames.CREATE_ORDER, (data) => {
  // Handle create order event
});
```

### Validation Schemas (`validationSchemas.js`)

**Purpose:**

Provides validation schemas for incoming events using [Zod](https://github.com/colinhacks/zod). This ensures that the data received from clients adheres to the expected structure and types, enhancing the application's robustness and security.

**Key Components:**

- **EventSchemas:** An object mapping each incoming event to its corresponding validation schema.
- **isValidationSuccess:** A utility function to validate incoming data against the defined schemas.

**Example:**

```javascript
import {
  createOrderRequestDto,
  cancelOrderRequestDto,
} from '../order/index.js';
import { subscriptionPairRequestDto } from '../subscription/index.js';
import { tradePairRequestDto } from '../trade/index.js';
import { IncomingEventNames } from './eventConstants.js';

export const EventSchemas = {
  [IncomingEventNames.CREATE_ORDER]: createOrderRequestDto,
  [IncomingEventNames.CANCEL_ORDER]: cancelOrderRequestDto,
  // ... other event schemas
};

/**
 * Validates incoming event data against its schema.
 *
 * @param {keyof EventSchemas} event - The event name.
 * @param {object} data - The payload data.
 * @returns {boolean} - Whether the validation was successful.
 */
export const isValidationSuccess = (event, data) => {
  return EventSchemas[event]
    ? EventSchemas[event].safeParse(data).success
    : true;
};
```

**Usage:**

Integrate validation middleware to automatically validate incoming Socket.io events.

```javascript
import { socketDtoMiddleware } from '../../core/middlewares/validateSocket.js';
import { EventSchemas } from './validationSchemas.js';
import { IncomingEventNames } from './eventConstants.js';
import { Server } from 'socket.io';

const io = new Server(3000);

io.use(socketDtoMiddleware(EventSchemas));

io.on('connection', (socket) => {
  socket.on(IncomingEventNames.CREATE_ORDER, (data) => {
    if (isValidationSuccess(IncomingEventNames.CREATE_ORDER, data)) {
      // Proceed with handling the event
    } else {
      // Handle validation failure
    }
  });
});
```

## Usage

1. **Defining Events:**
   - Use `eventConstants.js` to define all event names, ensuring they are categorized appropriately.

2. **Validating Events:**
   - Utilize `validationSchemas.js` to define and enforce data schemas for incoming events.
   - Integrate `socketDtoMiddleware` to automatically validate event payloads before processing.

3. **Handling Events:**
   - Listen for incoming events using the standardized names from `IncomingEventNames`.
   - Emit responses using names from `OutgoingEventNames` or `ErrorEventNames` to communicate results or errors.

## Best Practices

- **Consistency:** Always use the defined constants for event names to avoid typos and ensure uniformity.
- **Validation:** Rigorously validate all incoming data to prevent malformed or malicious inputs.
- **Modularity:** Keep event definitions and validations organized and separate from business logic for clarity and maintainability.
- **Documentation:** Regularly update event names and schemas as the application evolves to reflect current functionalities accurately.
