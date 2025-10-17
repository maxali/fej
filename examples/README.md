# Fej Examples

A comprehensive collection of examples demonstrating how to use fej in various scenarios.

## Overview

This directory contains practical, runnable examples covering all major fej features and use cases. Each example is self-contained with its own README and can be run independently.

## Quick Start

```bash
# Install dependencies for all examples
cd examples/<example-name>
npm install

# Run an example
npm start
# or
node <example-file>.js
```

## Examples by Category

### 🚀 Basic Usage (`basic-usage/`)

The fundamentals of using fej for HTTP requests.

- **Simple GET Request** - Making basic GET requests
- **POST Request with JSON** - Sending JSON data
- **Custom Headers** - Adding custom headers to requests
- **Multiple Instances** - Using multiple fej instances with different configurations
- **Request Cancellation** - Cancelling requests using AbortController

```bash
cd basic-usage
npm install
npm run simple-get
```

[View README](./basic-usage/README.md)

---

### 🔐 Authentication (`authentication/`)

Common authentication patterns and best practices.

- **Bearer Token Authentication** - Using bearer tokens with middleware
- **API Key Authentication** - Header and query parameter API keys
- **Dynamic Tokens** - Token refresh and rotation patterns
- **Environment-based Keys** - Managing different API keys per environment

```bash
cd authentication
npm install
npm run bearer-token
```

[View README](./authentication/README.md)

---

### ❌ Error Handling (`error-handling/`)

Robust error handling strategies and patterns.

- **Basic Error Handling** - Network, HTTP, and parsing errors
- **Retry Logic** - Automatic retries with exponential backoff
- **Error Middleware** - Custom error handling middleware
- **Circuit Breaker** - Preventing cascading failures
- **Error Recovery** - Graceful fallbacks and error recovery

```bash
cd error-handling
npm install
npm run basic-errors
```

[View README](./error-handling/README.md)

---

### 🧪 Testing (`testing/`)

Testing strategies for applications using fej.

- **Mocking Requests** - Different mocking strategies for unit tests
- **Testing Middleware** - How to test custom middleware
- **Integration Testing** - End-to-end testing with real APIs
- **Request Spies** - Tracking and asserting on requests
- **Test Utilities** - Reusable testing helpers

```bash
cd testing
npm install
npm test
```

[View README](./testing/README.md)

---

### ⚛️ React Hooks (`react-hooks/`)

React integration with custom hooks.

- **useFej** - Basic hook for using fej in React
- **useFejQuery** - Query hook with loading/error states (like React Query)
- **useFejMutation** - Mutation hook for POST/PUT/DELETE operations
- **Automatic Cleanup** - Request cancellation on component unmount
- **TypeScript Support** - Type-safe API calls

```bash
cd react-hooks
npm install
npm run dev
```

[View README](./react-hooks/README.md)

---

### 🏗️ API Client (`api-client/`)

Real-world example of building a complete API client.

- **Instance-based Configuration** - Creating configured fej instances
- **Middleware Stack** - Authentication, logging, retry, error handling
- **Custom Middleware** - Request timing and custom middleware
- **Composable Patterns** - Reusable middleware components

```bash
cd api-client
npm install
npm start
```

[View README](./api-client/README.md)

---

## Learning Path

If you're new to fej, we recommend following this learning path:

1. **Start with Basic Usage** - Learn the fundamentals
2. **Add Authentication** - Understand middleware and authentication patterns
3. **Master Error Handling** - Build robust error handling
4. **Learn Testing** - Write testable code
5. **Framework Integration** - Integrate with your framework (React, etc.)
6. **Build a Real API Client** - Combine everything into a production-ready client

## Running Examples

### Individual Examples

Each example directory has its own `package.json` with npm scripts:

```bash
cd <example-directory>
npm install
npm run <script-name>
```

### All Examples

To install dependencies for all examples:

```bash
# From the examples directory
for dir in */; do
  if [ -f "$dir/package.json" ]; then
    echo "Installing $dir"
    (cd "$dir" && npm install)
  fi
done
```

## Example Structure

Each example follows this structure:

```
example-name/
├── README.md           # Documentation and usage
├── package.json        # Dependencies and scripts
├── *.js               # Example files
└── ...                # Additional files as needed
```

## External Dependencies

All examples use:
- **fej** - Linked from the parent directory (`file:../..`)
- **JSONPlaceholder** - Free fake API for testing (https://jsonplaceholder.typicode.com)

Some examples also use:
- **React** & **React DOM** (react-hooks example)
- **Vite** (react-hooks example)

## Testing the Examples

Most examples can be run directly with Node.js:

```bash
node example-file.js
```

The testing examples include their own test runner:

```bash
cd testing
npm test
```

The React example uses Vite dev server:

```bash
cd react-hooks
npm run dev
```

## Contributing Examples

When adding new examples:

1. Create a new directory under `examples/`
2. Include a detailed `README.md`
3. Add a `package.json` with npm scripts
4. Use clear, commented code
5. Make examples self-contained and runnable
6. Update this main README with a link

## Getting Help

- [Main Documentation](../README.md)
- [API Documentation](../docs/)
- [GitHub Issues](https://github.com/gbm-dev/fej/issues)

## License

All examples are MIT licensed, same as the main fej library.
