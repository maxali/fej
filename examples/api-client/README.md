# API Client Example

A simple real-world example demonstrating how to use fej to build an API client with middleware.

## Features Demonstrated

- Instance-based configuration (v2 pattern)
- Bearer token authentication
- Request logging
- Automatic retries
- Error handling
- Custom middleware for request timing

## Setup

```bash
npm install
```

## Run

```bash
npm start
```

## What This Example Shows

This example creates an API client that:

1. **Authentication**: Automatically adds bearer tokens to all requests
2. **Logging**: Logs all requests and responses for debugging
3. **Retry Logic**: Automatically retries failed requests with exponential backoff
4. **Error Handling**: Transforms and logs errors consistently
5. **Custom Middleware**: Adds request timing information

The example uses [JSONPlaceholder](https://jsonplaceholder.typicode.com/) as a free test API.

## Code Structure

- Creates a fej instance with base configuration
- Adds middleware for common concerns (auth, logging, retry, errors)
- Demonstrates GET and POST requests
- Shows how to create custom middleware

## Key Takeaways

- Use `createFej()` to create isolated API clients
- Middleware runs in priority order (higher priority = earlier execution)
- Each middleware can modify request properties
- Middleware is composable and reusable
