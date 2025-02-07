# 📡 Subscription Module

## 📖 Overview

The **Subscription Module** manages real-time WebSocket subscriptions for trading pairs, enabling clients to receive live order book updates and trade execution notifications. This module ensures efficient broadcasting of market data while optimizing server resources.

## 🚀 Features

- **Subscribe to a trading pair**: Clients can join rooms based on trading pairs (e.g., `ETH_USD`).
- **Unsubscribe from a trading pair**: Clients can leave rooms when they no longer need updates.
- **Real-time order book updates**: The system automatically broadcasts order book updates at an 8-second interval for active trading pairs.
- **Efficient broadcasting**: Interval-based updates only run when at least one client is subscribed.
- **Automatic cleanup**: Stops broadcasting when no clients remain.

## 📌 Key Components

### **1️⃣ SubscriptionSocketController**

Handles WebSocket connections for subscriptions.

- **Handles subscription requests (`SUBSCRIBE_PAIR`)**
- **Handles unsubscription requests (`UNSUBSCRIBE_PAIR`)**
- **Handles direct client requests for top order book (`GET_TOP_ORDER_BOOK`)**
- **Automatically broadcasts order book updates (`TOP_ORDER_BOOK`)**

### **2️⃣ DTOs (Data Transfer Objects)**

Defines validation rules for incoming subscription requests.

- **`SubscriptionPairRequestDto`**: Validates trading pair subscriptions.
- **`TopOrderRequestDto`**: Validates order book requests.

## 🔄 Workflow

1. **User subscribes to a trading pair** (e.g., `ETH_USD`).
   - The client joins the room corresponding to the pair.
   - If no broadcasting is active, a new interval-based update loop starts.
2. **Order book updates are automatically broadcasted** every 8 seconds.
   - Only active trading pairs with subscribers receive updates.
3. **User unsubscribes** from a trading pair.
   - The client leaves the corresponding room.
   - If no active subscribers remain, the broadcasting loop stops.
4. **Client can manually request order book data**.
   - Uses `GET_TOP_ORDER_BOOK` to fetch the latest bids and asks.

## 🔥 WebSocket Events

### **Incoming Events (Client -> Server)**

| Event             | Description                      |
| ----------------- | -------------------------------- |
| `subscribePair`   | Subscribes to a trading pair     |
| `unsubscribePair` | Unsubscribes from a trading pair |
| `getTopOrderBook` | Requests the latest order book   |

### **Outgoing Events (Server -> Client)**

| Event          | Description                                   |
| -------------- | --------------------------------------------- |
| `subscribed`   | Acknowledgment of a successful subscription   |
| `unsubscribed` | Acknowledgment of a successful unsubscription |
| `topOrderBook` | Broadcasts order book updates                 |

## 🏗️ Example Payloads

### ✅ **Subscribe Response**

```json
{
  "success": true,
  "message": "Subscribing to ETH_USD pair is successful"
}
```

### ✅ **Unsubscribe Response**

```json
{
  "success": true,
  "message": "Unsubscribing to ETH_USD pair is successful"
}
```

### ✅ **Order Book Update**

```json
{
  "event": "topOrderBook",
  "success": true,
  "data": {
    "ETH_USD": {
      "bids": [
        {
          "orderId": "76a7d120-e777-47e3-b5ef-4f6d36622885",
          "pair": "ETH_USD",
          "price": 15,
          "quantity": 0.5,
          "side": "BUY",
          "status": "OPEN"
        }
      ],
      "asks": [
        {
          "orderId": "b49c5459-33a8-427a-9759-941f6217adee",
          "pair": "ETH_USD",
          "price": 15,
          "quantity": 0.5,
          "side": "SELL",
          "status": "OPEN"
        }
      ]
    }
  }
}
```

## 🛠️ Additional Notes

- Order book updates run **only when active clients exist**.
- The interval broadcasting **stops automatically** when all users disconnect.
- Users can manually request the order book for instant updates.

📌 **For more details on WebSocket event validation, check out the [Events Module](../events/README.md).**
