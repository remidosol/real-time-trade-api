# Core Directory

The `core` directory serves as the foundation of the application, providing essential utilities and infrastructure components that support various functionalities across the project. It centralizes critical aspects such as error handling, logging, middleware, response structuring, and global constants, ensuring consistency and maintainability.

## Table of Contents

- [Overview](#overview)
- [Components](#components)
  - [Exceptions](#exceptions)
  - [Logger](#logger)
  - [Middlewares](#middlewares)
  - [Responses](#responses)
  - [Global Constants](#global-constants)
- [Usage](#usage)
- [Best Practices](#best-practices)

## Overview

The `core` directory encapsulates shared utilities and foundational components that are utilized throughout the application. By centralizing these elements, the application ensures a unified approach to common tasks, promoting scalability and ease of maintenance.

## Components

### Exceptions

**File:** `exceptions/ApiError.js`

**Description:**
Defines a custom `ApiError` class that extends the native `Error` class. It standardizes error handling by including HTTP status codes and custom messages, facilitating consistent error responses across the application.

**Usage:**

```javascript
import { ApiError } from './core/exceptions/ApiError.js';

// Throwing a custom API error
throw new ApiError(404, 'Resource not found');
```

### Logger

**File:** `logger/Logger.js`

**Description:**
Implements a centralized logging system using the [Winston](https://github.com/winstonjs/winston) library. It supports multiple log levels, formats logs with timestamps and colors, and handles different environments (development, production).

**Features:**

- **Log Levels:** `debug`, `info`, `warn`, `error`
- **Formats:** Timestamped and colorized logs
- **Transports:** Console logging with customizable settings

**Usage:**

```javascript
import logger from './core/logger/Logger.js';

// Logging messages
logger.info('Server started successfully');
logger.error('Failed to connect to database', { error: dbError });
```

### Middlewares

#### Error Handling

**File:** `middlewares/errorHandler.js`

**Description:**
Provides middleware functions for converting errors and handling them uniformly across the application. It ensures that errors are properly formatted and logged before sending responses to clients.

**Usage:**

```javascript
import {
  errorConverter,
  errorHandler,
} from './core/middlewares/errorHandler.js';
import express from 'express';

const app = express();

// ... other middlewares and routes

// Error handling middlewares
app.use(errorConverter);
app.use(errorHandler);
```

#### Socket Validation

**File:** `middlewares/validateSocket.js`

**Description:**
Validates incoming Socket.io event payloads against predefined schemas using [Zod](https://github.com/colinhacks/zod). It ensures that real-time data adheres to expected structures, enhancing reliability and security.

**Usage:**

```javascript
import { socketDtoMiddleware } from './core/middlewares/validateSocket.js';
import { EventSchemas } from './modules/events/index.js';
import { Server } from 'socket.io';

const io = new Server(3000);

io.use(socketDtoMiddleware(EventSchemas));

io.on('connection', (socket) => {
  // Handle events
});
```

### Responses

**File:** `responses/EmitResponse.js`

**Description:**
Defines the `EmitResponse` class to standardize responses emitted through Socket.io events. It encapsulates success flags, messages, and data payloads, ensuring consistent communication between server and clients.

**Usage:**

```javascript
import { EmitResponse } from './core/responses/EmitResponse.js';
import { OutgoingEventNames, ErrorEventNames } from './modules/events/index.js';

// Emitting a success response
const successResponse = EmitResponse.Success({
  event: OutgoingEventNames.ORDER_CREATED,
  message: 'Order created successfully',
  data: order,
});
socket.emit(OutgoingEventNames.ORDER_CREATED, successResponse);

// Emitting an error response
const errorResponse = EmitResponse.Error({
  event: ErrorEventNames.VALIDATION_ERROR,
  message: 'Invalid room name',
  error: validationError.details,
});
socket.emit(ErrorEventNames.VALIDATION_ERROR, errorResponse);
```

### Global Constants

**File:** `globalConstants.js`

**Description:**
Houses application-wide constants that are used across various modules. This ensures consistency and ease of updates for values that are referenced in multiple places.

**Example Constants:**

```javascript
export const SupportedPairs = {
  BTC_USD: 'BTC_USD',
  ETH_USD: 'ETH_USD',
  XRP_USD: 'XRP_USD',
  LTC_USD: 'LTC_USD',
  BNB_USD: 'BNB_USD',
};
```

**Usage:**

```javascript
import { SupportedPairs } from './core/globalConstants.js';

const tradingPair = SupportedPairs.BTC_USD;
```

## Usage

1. **Error Handling:**

   - Use `ApiError` to throw standardized errors within your application.
   - Apply `errorConverter` and `errorHandler` middleware in your Express app to manage and respond to errors uniformly.

2. **Logging:**

   - Utilize the `logger` instance to log informational messages, warnings, errors, and debug data.
   - Configure log levels based on the environment to control verbosity.

3. **Socket.io Integration:**

   - Apply `validateSocket` middleware to ensure incoming Socket.io events have valid payloads.
   - Use `EmitResponse` to emit consistent responses back to clients for real-time events.

4. **Global Constants:**
   - Reference `globalConstants.js` for any constants needed across different modules to maintain consistency.

## Best Practices

- **Centralized Error Management:** Always throw and handle errors using the `ApiError` class to maintain consistency in error responses.
- **Consistent Logging:** Use the `logger` for all logging needs to ensure that logs are uniform and easily searchable.
- **Payload Validation:** Implement `validateSocket` middleware to safeguard against malformed or malicious data in real-time communications.
- **Reuse Constants:** Leverage `globalConstants.js` to avoid hardcoding values, making the application easier to manage and update.
