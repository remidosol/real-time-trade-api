# Real-Time Trade API

![License](https://img.shields.io/badge/license-MIT-blue.svg)

Real-Time Trade API is a robust and scalable backend service designed to handle real-time trading operations. Leveraging modern technologies such as Socket.io, Redis, and Express.js, this API facilitates efficient order management, trade execution, and real-time updates for trading pairs. It ensures high performance, reliability, and maintainability, making it ideal for applications requiring real-time trading capabilities.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
  - [Using Docker Compose](#using-docker-compose)
  - [Development Mode](#development-mode)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Linting and Formatting](#linting-and-formatting)
- [Documentation](#documentation)
- [Architecture](#architecture)
- [References](#references)

## Features

- **Real-Time Communication:** Utilizes Socket.io with Redis Streams Adapter to handle real-time events, ensuring reliable and efficient communication between clients and the server.
- **Order Management:** Supports creating, cancelling, and filling orders with robust validation and persistence using Redis.
- **Trade Execution:** Automatically matches top buy and sell orders, executing trades and updating order statuses.
- **Subscription Management:** Allows clients to subscribe to specific trading pairs to receive real-time updates on order books and trades.
- **Scalability:** Designed to handle a large number of concurrent connections and high-frequency trading operations.
- **Comprehensive Documentation:** Uses AsyncAPI for detailed documentation of Socket.io events, facilitating easy integration and maintenance.

## Tech Stack

- **Language:** JavaScript (ESNext)
- **Runtime:** Node.js
- **Framework:** Express.js
- **Real-Time Communication:** Socket.io with Redis Streams Adapter
- **Database:** Redis (using ioredis)
- **Build Tools:** Webpack, Babel
- **Testing:** Jest
- **Containerization:** Docker, Docker Compose
- **Linting & Formatting:** ESLint, Prettier
- **Documentation:** AsyncAPI

## Getting Started

### Prerequisites

- **Node.js:** v16.x or later
- **Yarn:** v1.x or later
- **Docker:** v20.x or later
- **Docker Compose:** v1.29.x or later

### Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/remidosol/real-time-trade-api.git
   cd real-time-trade-api
   ```

2. **Install Dependencies:**

   ```bash
   yarn install
   ```

### Environment Configuration

1. **Setup Environment Variables:**

   - Copy the example environment variables file:

     ```bash
     cp secrets/.env.example secrets/.env
     ```

   - Open `secrets/.env` and configure the necessary environment variables:

     ```env
     NODE_ENV=dev
     PORT=3333
     REDIS_HOST=redis
     REDIS_PORT=6379
     ```

   **Note:** Ensure that sensitive information is kept secure and `.env` is excluded from version control.

## Running the Application

### Using Docker Compose

The application is containerized using Docker, facilitating easy setup and deployment.

1. **Start Services:**

   ```bash
   docker-compose up -d --build
   ```

   This command will build and start the Redis and Trade API services in detached mode.

2. **Verify Services:**

   - **Redis:** Accessible on `localhost:6379`.
   - **Trade API:** Accessible on `localhost:3333`.

3. **Stopping Services:**

   ```bash
   docker-compose down
   ```

### Development Mode

For development purposes, you can run the application directly without Docker.

1. **Start Redis:**

   Ensure that a Redis server is running locally on port `6379`. You can start Redis using Docker:

   ```bash
   docker run -d --name redis_server -p 6379:6379 redis:7-alpine
   ```

2. **Start the Application:**

   ```bash
   yarn start:dev
   ```

   This will start the application in development mode with hot-reloading enabled.

## Available Scripts

- **Build:**

  ```bash
  yarn build
  ```

  Bundles the application using Webpack.

- **Start:**

  ```bash
  yarn start
  ```

  Starts the application using Node.js.

- **Start Development:**

  ```bash
  yarn start:dev
  ```

  Starts the application in development mode with hot-reloading.

- **Generate Documentation:**

  ```bash
  yarn docs:generate
  ```

  Generates AsyncAPI documentation for Socket.io events.

- **Test:**

  ```bash
  yarn test
  ```

  Runs unit tests using Jest.

- **Lint:**

  ```bash
  yarn lint
  ```

  Runs ESLint to identify and fix linting issues.

- **Fix Lint:**

  ```bash
  yarn lint:fix
  ```

  Automatically fixes linting issues where possible.

- **Format:**

  ```bash
  yarn format
  ```

  Formats the codebase using Prettier.

## Testing

The application uses [Jest](https://jestjs.io/) for unit testing.

- **Run Tests:**

  ```bash
  yarn test
  ```

- **Test Coverage:**

  Jest can be configured to provide test coverage reports.

  ```bash
  yarn test --coverage
  ```

**Note:** Ensure that tests are written for critical components to maintain code quality and reliability.

## Linting and Formatting

Maintaining consistent code style and quality is crucial for collaboration and maintainability.

- **Linting:**

  The project uses [ESLint](https://eslint.org/) with the Airbnb base configuration.

  - **Run Linter:**

    ```bash
    yarn lint
    ```

  - **Fix Linting Issues:**

    ```bash
    yarn lint:fix
    ```

- **Formatting:**

  [Prettier](https://prettier.io/) is used for code formatting.

  - **Format Code:**

    ```bash
    yarn format
    ```

- **Pre-Commit Hooks:**

  [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/okonet/lint-staged) are configured to run linting and formatting on staged files before commits.

## Documentation

Comprehensive documentation is provided using [AsyncAPI](https://www.asyncapi.com/) to describe the Socket.io events and their payloads.

- **Generate Documentation:**

  ```bash
  yarn docs:generate
  ```

  This command generates HTML documentation from the `asyncapi.yaml` file, outputting it to the `docs` directory.

- **Access Documentation:**

  Open the generated documentation in the `docs` directory using a web browser.

## Architecture

The application follows a modular architecture, organizing related functionalities into distinct modules for better maintainability and scalability. Each module encapsulates its own controllers, services, repositories, models, and data transfer objects (DTOs). Below is a summary of each module:

### Modules Overview

- **[Events Module](./src/modules/events/README.md):**
  Centralizes the definition and management of event names and validation schemas used across the application, ensuring consistent real-time communication.

- **[Order Module](./src/modules/order/README.md):**
  Manages order-related operations, including creating, cancelling, and filling orders. It interacts with Redis to maintain the order book and ensures real-time updates.

- **[Subscription Module](./src/modules/subscription/README.md):**
  Handles client subscriptions to specific trading pairs, enabling clients to receive real-time updates on order books and trades for their subscribed pairs.

- **[Trade Module](./src/modules/trade/README.md):**
  Orchestrates trade execution by matching buy and sell orders, recording executed trades, and providing recent trade data to clients.

## References

- **[Inner Module READMEs](./src/modules/README.md):** Detailed documentation for each module.
- **[AsyncAPI Documentation](./asyncapi.yaml):** Defines the Socket.io events and their payloads.
- **[Docker Documentation](https://docs.docker.com/):** For understanding Docker and Docker Compose configurations.
- **[Express.js](https://expressjs.com/):** Web framework for Node.js.
- **[Socket.io](https://socket.io/):** Enables real-time, bidirectional communication between web clients and servers.
- **[Redis](https://redis.io/):** In-memory data structure store used for caching and persistence.
- **[Winston](https://github.com/winstonjs/winston):** Logging library for Node.js.
- **[Zod](https://github.com/colinhacks/zod):** TypeScript-first schema validation with static type inference.
- **[Jest](https://jestjs.io/):** JavaScript testing framework.
- **[Webpack](https://webpack.js.org/):** Module bundler.
- **[Babel](https://babeljs.io/):** JavaScript compiler.
- **[ESLint](https://eslint.org/):** Pluggable linting utility for JavaScript.
- **[Prettier](https://prettier.io/):** Opinionated code formatter.
