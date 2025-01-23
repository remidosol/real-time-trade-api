# 🚀 Real-Time Trading API

## 📖 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture & Design](#architecture--design)
- [Directory Structure](#directory-structure)
- [WebSocket Events & API Docs](#websocket-events--api-docs)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Docker Setup](#docker-setup)
- [Development & Testing](#development--testing)
- [License](#license)
- [Contribution](#contribution)
- [Contact](#contact)

## 🌟 Overview

The **Real-Time Trading API** is a **high-performance WebSocket-based** system designed for cryptocurrency trading. It enables:

- **Order management** (creation, cancellation, and execution)
- **Real-time trade execution** using a **matching engine**
- **WebSocket-based event-driven architecture**
- **Redis-based caching & persistence**
- **Scalability** with **Redis Streams Adapter for Socket.IO** to ensure real-time consistency

## 🛠️ Tech Stack

- **JavaScript (ESNext)** → Modern ECMAScript features.
- **Express.js** → Fast and scalable Node.js framework.
- **Socket.IO** → Handles WebSocket real-time communication.
- **Redis & ioredis** → Used for caching and persistence.
- **Socket.IO Redis Streams Adapter** → Prevents TCP package loss and ensures event consistency.
- **Webpack & Babel** → Transpiles and bundles ESNext code.
- **Jest** → Unit testing framework.
- **Docker & Docker Compose** → Containerized deployment.
- **ESLint & Prettier** → Code quality and formatting.
- **AsyncAPI** → API documentation for WebSocket events.

## 🏗️ Architecture & Design

### Why Socket.IO Instead of WebSocket?

- **Automatic Reconnection** → Handles disconnections gracefully.
- **Event-Based Communication** → Provides built-in event handling instead of raw messages.
- **Room Management** → Allows grouping clients into rooms, making broadcasting efficient.
- **Scalability with Redis** → Works seamlessly with Redis Streams Adapter for distributed setups.

### Room-Based Subscription Model

Each trading pair is represented as a **room** in Socket.IO. Clients subscribe to rooms to receive updates:

1. **User subscribes to a trading pair** (e.g., `ETH_USD`) by joining the **`/subscription` namespace** and entering the room `ETH_USD`.
2. **User creates a buy order (bid)**. If a **sell order (ask)** already exists at the same price, they can be matched.
3. **Matching engine processes the top orders**:
   - `matchTopOrders` event is emitted.
   - If prices/quantities are not equal, a **partial fill** occurs.
4. **Trade execution event (`tradeExecuted`) is broadcasted** to users in the subscribed room.

### Why Redis Streams Adapter?

- **Ensures event delivery** → Prevents TCP packet loss.
- **Supports multi-instance deployments** → Scales WebSocket events across multiple API instances.
- **Event persistence** → Temporarily stores events to handle unexpected client disconnections.

### Why Redis Hash & Sorted Set?

- **Redis Hash** → Stores **individual orders and trades**, enabling fast lookups.
- **Redis Sorted Set** → Used for **order books**:
  - **Bids (BUY orders)** → Negative price scores (highest first).
  - **Asks (SELL orders)** → Positive price scores (lowest first).

## 📂 Directory Structure

```
real-time-trade-api
├── secrets/                   # Environment variables
├── src/                       # Main source code
│   ├── config/                # Configuration (Redis, env variables)
│   ├── core/                  # Core utilities (middleware, logging, exceptions)
│   ├── modules/               # Business logic modules
│   │   ├── events/            # Event constants & validation
│   │   ├── order/             # Order management logic
│   │   ├── trade/             # Trade execution logic
│   │   ├── subscription/      # WebSocket subscription handling
│   ├── app.js                 # Express & Socket.IO initialization
│   ├── index.js               # Main entry point
├── tests/                     # Jest test setup
├── docker-compose.yml         # Docker Compose setup
├── Dockerfile.dev             # Development Dockerfile
├── Dockerfile.prod            # Production Dockerfile
├── package.json               # Node.js dependencies & scripts
├── asyncapi.yaml              # WebSocket API documentation
└── README.md                  # This file
```

## 📡 WebSocket Events & API Docs

The API uses **WebSocket (Socket.IO)** for event-driven communication. For a full list of **supported events and payload schemas**, refer to the **[AsyncAPI Documentation](./asyncapi.yaml)**.

## 🚀 Getting Started

### 1️⃣ Install Dependencies

```sh
yarn install
```

### 2️⃣ Run Locally (Without Docker)

```sh
yarn start:dev
```

### 3️⃣ Run with Docker Compose

```sh
docker-compose up --build
```

### 4️⃣ Build and Run the Production Version

```sh
yarn build
yarn start:bundled
```

## 📜 Environment Variables

Configuration is managed via `.env` files. See **[.env.example](./secrets/.env.example)** for required environment variables.

```env
NODE_ENV=dev
PORT=3333
REDIS_HOST=redis
REDIS_PORT=6379
```

## 🐳 Docker Setup

This project uses **Docker Compose** for managing dependencies:

- **Redis** → Used for caching and event distribution.
- **Trade API** → The main service running Express.js & Socket.IO.

Start the project with:

```sh
docker-compose up --build
```

## 🛠️ Development & Testing

### **Lint & Format Code**

```sh
yarn lint
yarn format
```

### **Run Tests**

```sh
yarn test
```

## 📌 Modules Overview

- **[Order Module](./src/modules/order/README.md)** → Manages order creation, cancellation, and execution.
- **[Trade Module](./src/modules/trade/README.md)** → Matches buy/sell orders and executes trades.
- **[Subscription Module](./src/modules/subscription/README.md)** → Handles WebSocket subscriptions to order book updates.
- **[Events Module](./src/modules/events/README.md)** → Defines event constants and validation schemas.
- **[Core Utilities](./src/core/README.md)** → Logging, middleware, and global utilities.
- **[Config](./src/config/README.md)** → Environment variables and Redis configuration.

## 📖 License

This project is licensed under the **MIT License**.

## 🤝 Contribution

Feel free to submit issues, feature requests, or contribute to the project.

## 📬 Contact

- GitHub: [remidosol](https://github.com/remidosol)
