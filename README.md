# fej

Fetch API with middleware - simple, powerful, and TypeScript-first.

fej provides a clean middleware API for the native Fetch API, allowing you to modify request properties, handle errors, implement retries, and more.

## ✨ Features

- 🎯 **Instance-based configuration** - Create multiple independent instances
- 🔧 **Named middleware** with priority ordering
- 🔄 **Unified API** - One `use()` method for all middleware
- ⚡ **Error handling & retry** - Built-in retry logic and error transforms
- 🚫 **Request cancellation** - AbortController integration with tags
- 📦 **Zero dependencies** - Optimized bundle size (13.14 KB minified, 4.36 KB gzipped)
- 🛡️ **TypeScript-first** - Full type safety with TypeScript 5.x
- 🧪 **Well-tested** - 80%+ code coverage
- 🌐 **Modern** - Requires Node.js 18+ (native fetch support)

## 📚 Documentation

- **[API Documentation](https://maxali.github.io/fej/)** - Full API reference with examples
- **[Contributing](./CONTRIBUTING.md)** - How to contribute to the project
- **[Changelog](./CHANGELOG.md)** - Version history and changes

## 📦 Installation

```bash
npm install fej
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { createFej } from 'fej';

// Create a new instance
const api = createFej();

// Make a request
const response = await api.fej('https://api.example.com/users');
const data = await response.json();
```

### With Configuration

```typescript
import { createFej } from 'fej';

const api = createFej({
  baseURL: 'https://api.example.com',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 5000,
  retry: {
    attempts: 3,
    delay: 1000,
    backoff: 'exponential',
  },
});

// Make requests with base configuration
const response = await api.fej('/users'); // https://api.example.com/users
```

## 🔧 Middleware

### Adding Middleware

Middleware uses a Koa-style onion model with `async/await`:

```typescript
import { createFej } from 'fej';

const api = createFej();

// Add authentication middleware
api.use('auth', async (ctx, next) => {
  // Before request
  const token = await getAuthToken();
  ctx.request.init.headers = new Headers(ctx.request.init.headers);
  ctx.request.init.headers.set('Authorization', `Bearer ${token}`);

  await next(); // Execute request

  // After response (optional)
  console.log(`Status: ${ctx.response?.status}`);
});

// Make request with middleware
const response = await api.fej('https://api.example.com/protected');
```

### Middleware Priority

Control execution order with priority (higher runs first):

```typescript
api.use('auth', authMiddleware, 100);    // Runs first
api.use('logger', loggerMiddleware, 50); // Runs second
api.use('retry', retryMiddleware, 10);   // Runs third
```

### Request/Response Logging

```typescript
api.use('logger', async (ctx, next) => {
  const start = Date.now();
  console.log(`→ ${ctx.request.init.method || 'GET'} ${ctx.request.url}`);

  await next();

  const duration = Date.now() - start;
  console.log(`← ${ctx.response?.status} (${duration}ms)`);
});
```

## 🚫 Request Cancellation

### Basic Cancellation

```typescript
const { controller, requestId } = api.createAbortController();

// Make cancellable request
const fetchPromise = api.fej('https://api.example.com/data', {
  signal: controller.signal,
});

// Cancel the request
api.abortRequest(requestId);
```

### Tagged Cancellation

Cancel groups of related requests:

```typescript
// Tag requests
const { controller: c1 } = api.createAbortController(undefined, ['dashboard']);
const { controller: c2 } = api.createAbortController(undefined, ['dashboard']);

const p1 = api.fej('/users', { signal: c1.signal });
const p2 = api.fej('/stats', { signal: c2.signal });

// Cancel all dashboard requests
api.abortRequestsByTag('dashboard');
```

## 🔄 Error Handling

### Error Transforms

```typescript
api.addErrorTransform(async (error, ctx) => {
  // Add context to errors
  const enhancedError = new Error(
    `Request to ${ctx.request.url} failed: ${error.message}`
  );
  enhancedError.stack = error.stack;
  return enhancedError;
});
```

### Retry Configuration

```typescript
api.setDefaultRetry({
  attempts: 5,
  delay: 2000,
  maxDelay: 30000,
  backoff: 'exponential',
});
```

## 🎯 Multiple Instances

Create separate instances for different APIs:

```typescript
const userApi = createFej({
  baseURL: 'https://api.example.com',
  retry: { attempts: 3 },
});

const paymentApi = createFej({
  baseURL: 'https://payments.example.com',
  retry: { attempts: 10 }, // More retries for critical operations
  timeout: 30000,
});

// Each instance has independent configuration
const users = await userApi.fej('/users');
const payment = await paymentApi.fej('/charge');
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Quick Start for Contributors

```bash
# Clone the repository
git clone https://github.com/maxali/fej.git
cd fej

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run linter
npm run lint
```

---

## 📝 License

ISC License - see LICENSE file for details

---

## 🔗 Links

- [npm package](https://www.npmjs.com/package/fej)
- [GitHub repository](https://github.com/maxali/fej)
- [Issue tracker](https://github.com/maxali/fej/issues)
- [Changelog](./CHANGELOG.md)

---

## ⭐ Support

If you find fej useful, please consider:

- ⭐ Starring the repository
- 📢 Sharing it with others
- 🐛 Reporting bugs
- 💡 Suggesting features
- 🔧 Contributing code
