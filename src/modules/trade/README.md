# Trade Module

The `trade` module is a pivotal component of the application, responsible for managing trade-related functionalities. It handles the execution of trades by matching orders, maintaining trade records, and providing real-time updates to clients. This module ensures efficient and reliable trade processing, leveraging Redis for data storage and Socket.io for real-time communication.

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

The `trade` module orchestrates the core trading operations within the application. It facilitates the matching of buy and sell orders, records executed trades, and disseminates trade information to subscribed clients. By integrating with Redis, it ensures high-performance data access and scalability, while Socket.io enables seamless real-time interactions.

## Components

### Controllers

**File:** `controllers/TradeSocketController.js`

**Description:**

Handles Socket.io events related to trade operations. It listens for events such as `matchTopOrders` and `getRecentTrades`, processes these requests through the service layer, and emits appropriate responses or updates to clients.

**Key Responsibilities:**

- **Trade Execution:** Initiates the matching of top buy and sell orders.
- **Trade Retrieval:** Provides clients with recent trade data.
- **Error Handling:** Emits standardized error responses in case of failures or validation issues.

**Usage:**

Initialize the `TradeSocketController` with the Socket.io server to start handling trade-related events.

```javascript
import { Server } from 'socket.io';
import { TradeSocketController } from './controllers/TradeSocketController.js';

const io = new Server(3000, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Initialize Trade Socket Controller
new TradeSocketController(io);

console.log('Socket.io server is running on port 3000');
```

### Data Transfer Objects (DTOs)

**Directory:** `dtos/`

**Files:**

- `tradePairDto.js`
- `index.js`

**Description:**

Defines schemas for validating incoming trade-related data using [Zod](https://github.com/colinhacks/zod). Ensures that trade requests conform to expected structures, enhancing data integrity and security.

**Key Components:**

- **tradePairRequestDto:** Validates data for trade-related requests, such as matching orders and retrieving recent trades.

**Usage:**

Integrate DTOs within middleware to automatically validate incoming Socket.io events.

```javascript
import { socketDtoMiddleware } from '../../../core/middlewares/validateSocket.js';
import { EventSchemas } from '../../events/validationSchemas.js';
import { Server } from 'socket.io';

const io = new Server(3000);

// Apply validation middleware
io.of('/trade').use(socketDtoMiddleware(EventSchemas));

// Initialize Trade Socket Controller
new TradeSocketController(io);
```

### Models

**Directory:** `models/`

**Files:**

- `Trade.js`
- `index.js`

**Description:**

Defines the `Trade` model representing the structure of a trade within the system. It encapsulates trade attributes and provides a clear blueprint for trade data.

**Key Attributes:**

- `tradeId`
- `pair`
- `buyOrderId`
- `sellOrderId`
- `quantity`
- `price`
- `timestamp`

**Usage:**

Instantiate the `Trade` model when executing a trade to maintain consistent data structures.

```javascript
import { Trade } from './models/Trade.js';

const trade = new Trade({
  tradeId: 'unique-trade-id',
  pair: 'BTC_USD',
  buyOrderId: 'buy-order-id',
  sellOrderId: 'sell-order-id',
  quantity: 1.5,
  price: 45000,
  timestamp: Date.now(),
});
```

### Repositories

**Directory:** `repositories/`

**File:** `TradeRepository.js`

**Description:**

Manages interactions with the Redis database for trade-related operations. It handles the storage and retrieval of trade records, ensuring data persistence and quick access.

**Key Responsibilities:**

- **Storing Trades:** Saves executed trades in Redis using hashes and sorted sets.
- **Retrieving Trades:** Fetches trade data based on trade IDs or retrieves recent trades for specific trading pairs.

**Usage:**

Use the `TradeRepository` to interact with the trade data in Redis.

```javascript
import { tradeRepository } from '../repositories/TradeRepository.js';
import { Trade } from '../models/Trade.js';

// Storing a trade
const trade = new Trade({ /* trade data */ });
await tradeRepository.storeTrade(trade);

// Retrieving a trade
const retrievedTrade = await tradeRepository.getTrade('trade-id');
```

### Services

**Directory:** `services/`

**File:** `TradeService.js`

**Description:**

Contains the business logic for managing trades. It orchestrates the matching of orders, execution of trades, and retrieval of trade data by interacting with the repository layer.

**Key Responsibilities:**

- **Trade Matching:** Matches the top buy and sell orders for a trading pair.
- **Trade Execution:** Executes trades by updating order statuses and recording trade details.
- **Trade Retrieval:** Provides functionalities to fetch recent trades for clients.

**Usage:**

Leverage the `TradeService` to perform trade operations within controllers.

```javascript
import tradeService from '../services/TradeService.js';

// Matching top orders
const trade = await tradeService.matchTopOrders('BTC_USD');

// Getting recent trades
const recentTrades = await tradeService.getRecentTrades('BTC_USD', 10);
```

### Constants

**File:** `tradeConstants.js`

**Description:**

Defines constant values used within the trade module to ensure consistency and avoid magic strings.

**Key Constants:**

- **TradeStatus:** Represents the possible statuses of a trade (`OPEN`, `CANCELLED`, `FILLED`).

```javascript
export const TradeStatus = {
  OPEN: 'OPEN',
  CANCELLED: 'CANCELLED',
  FILLED: 'FILLED',
};
```

**Usage:**

Use these constants to set or check trade statuses.

```javascript
import { TradeStatus } from './tradeConstants.js';

trade.status = TradeStatus.FILLED;
```

## Usage

1. **Importing the Trade Module:**

   ```javascript
   import { TradeSocketController } from './modules/trade/controllers/TradeSocketController.js';
   ```

2. **Initializing with Socket.io:**

   ```javascript
   import { Server } from 'socket.io';
   import { TradeSocketController } from './modules/trade/controllers/TradeSocketController.js';

   const io = new Server(3000, {
     cors: {
       origin: '*',
       methods: ['GET', 'POST'],
     },
   });

   // Initialize Trade Socket Controller
   new TradeSocketController(io);

   console.log('Socket.io server is running on port 3000');
   ```

3. **Client-Side Interaction:**

   - **Match Top Orders:**

     ```javascript
     socket.emit('matchTopOrders', { pair: 'BTC_USD' });
     ```

   - **Get Recent Trades:**

     ```javascript
     socket.emit('getRecentTrades', { pair: 'BTC_USD', limit: 10 });
     ```

4. **Handling Server Responses:**

   Listen for events such as `tradeExecuted`, `noTrade`, and `recentTrades` to receive updates.

   ```javascript
   socket.on('tradeExecuted', (response) => {
     console.log('Trade Executed:', response);
   });

   socket.on('noTrade', (response) => {
     console.log('No Trade:', response);
   });

   socket.on('recentTrades', (data) => {
     console.log('Recent Trades:', data);
   });

   socket.on('tradeError', (error) => {
     console.error('Trade Error:', error);
   });
   ```

## Best Practices

- **Separation of Concerns:** Maintain clear boundaries between controllers, services, and repositories to enhance code maintainability and scalability.
- **Consistent Validation:** Utilize DTOs and validation middleware to ensure all incoming data adheres to expected formats, preventing malformed or malicious inputs.
- **Efficient Logging:** Use the centralized `logger` to record significant events and errors, aiding in monitoring and troubleshooting.
- **Resource Management:** Ensure that Socket.io connections are properly managed, and resources are released when clients disconnect to prevent memory leaks.
- **Scalability:** Design trade matching and execution logic to handle high volumes of orders efficiently, leveraging Redis' performance capabilities.
- **Documentation:** Keep module documentation up-to-date to assist developers in understanding module functionalities and usage patterns.
