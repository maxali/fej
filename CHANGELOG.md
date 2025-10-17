# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2025-10-17

### Added

- **Named Middleware** - Organize middleware with names and priorities
- **Instance-Based Configuration** - Create multiple independent instances with `createFej()`
- **Unified Middleware API** - Single `use()` method for all middleware (replaces `addMiddleware` and `addAsyncMiddleware`)
- **Koa-Style Middleware** - Modern `async (ctx, next)` pattern instead of RequestInit transforms
- **Error Handling & Retry** - Built-in retry logic with exponential backoff
- **Error Transforms** - Async error middleware for transforming errors
- **AbortController Integration** - Request cancellation by tag or custom signals
- **Built-in Middleware Utilities**:
  - `createRetryMiddleware()` - Configurable retry logic
  - `createTimeoutMiddleware()` - Request timeout handling
  - `createErrorMiddleware()` - Error transformation
  - `createCancellationMiddleware()` - Request cancellation
  - `createBearerTokenMiddleware()` - Bearer token authentication
  - `createLoggerMiddleware()` - Request/response logging
  - `createBaseURLMiddleware()` - Base URL configuration
  - `createDefaultHeadersMiddleware()` - Default headers
- **TypeScript 5.x Support** - Full type safety with strict mode
- **Modern Tooling**:
  - Vitest for testing (319+ comprehensive tests)
  - ESLint 9.x for linting
  - tsup for building
  - TypeDoc for documentation
- **Tree-Shakeable Builds** - Dual ESM/CJS support with proper exports
- **Source Maps** - Full source map support for debugging

### Changed

- **API Modernization**:
  - Replaced singleton pattern with instance-based approach
  - Unified middleware API using `use()` method
  - Middleware now uses Koa-style `(ctx, next)` pattern
- **Build System**: Modern build with tsup, replacing older setup
- **Testing**: Comprehensive test suite with 319+ tests
- **Documentation**: Complete rewrite with examples and migration guide
- **Bundle Size**: Optimized to 13.14 KB minified, 4.36 KB gzipped
- **Node.js Requirement**: Minimum version 18+ (native fetch support)

### Deprecated

- **Singleton Pattern**: `import Fej from 'fej'` - Use `createFej()` instead
- **setInit()**: Use instance configuration in `createFej({ ... })`
- **addMiddleware()**: Use `api.use(name, middleware)` instead
- **addAsyncMiddleware()**: Use `api.use(name, middleware)` instead (automatically handles async)

All deprecated APIs remain functional with console warnings and will be removed in a future major version.

### Fixed

- Async middleware execution bug (was awaiting array instead of results)
- `addMiddleware` incorrectly declared as async
- Deep merge edge cases with Headers objects
- TypeScript type safety issues
- Test coverage gaps

### Performance

- Zero runtime dependencies
- 4.36 KB gzipped bundle size
- Tree-shakeable exports
- Optimized middleware execution

### Developer Experience

- Complete [Migration Guide](./MIGRATION_GUIDE_V2.md)
- 15+ documentation guides
- 16+ complete examples
- TypeScript strict mode support
- Full API documentation with TypeDoc

### Links

- [API Documentation](https://maxali.github.io/fej/)
- [Migration Guide](./MIGRATION_GUIDE_V2.md)
- [npm Package](https://www.npmjs.com/package/fej)

---

## [1.0.6] - Previous Release

### Features

- Simple middleware API for fetch requests
- Global request initialization with `setInit()`
- Synchronous middleware support via `addMiddleware()`
- Asynchronous middleware support via `addAsyncMiddleware()`
- Deep merge strategy for combining request options
- TypeScript support with full type definitions
- Zero runtime dependencies

### Known Issues (Fixed in 1.1.0)

- Async middleware execution bug
- `addMiddleware` incorrectly declared as async
- Limited test coverage
- TypeScript compatibility issues

---

## [1.0.5]

### Changed

- Documentation improvements
- Type definition updates

---

## [1.0.4]

### Changed

- Documentation improvements
- Type definition updates

---

## [1.0.3]

### Fixed

- Minor bug fixes
- Type improvements

---

## [1.0.2]

### Changed

- Package metadata updates

---

## [1.0.1]

### Fixed

- Build configuration fixes

---

## [1.0.0] - Initial Release

### Added

- Initial implementation of fej
- Middleware pattern for fetch API
- Basic TypeScript support
- Documentation and examples

---

## Migration Guide

### Migrating from v1.0.x to v1.1.0

See [MIGRATION_GUIDE_V2.md](./MIGRATION_GUIDE_V2.md) for detailed migration instructions.

**Quick Summary:**

**Before (v1.0.x):**
```typescript
import Fej from 'fej';

Fej.setInit({ headers: { 'X-API-Key': 'key' } });
Fej.addMiddleware((init) => ({ ...init, mode: 'cors' }));
Fej.addAsyncMiddleware(async (init) => { /* ... */ });

const response = await Fej.fej('https://api.example.com/data');
```

**After (v1.1.0):**
```typescript
import { createFej } from 'fej';

const api = createFej({
  headers: { 'X-API-Key': 'key' }
});

api.use('cors', async (ctx, next) => {
  ctx.request.init.mode = 'cors';
  await next();
});

api.use('auth', async (ctx, next) => {
  // Async operations supported automatically
  await next();
});

const response = await api.fej('https://api.example.com/data');
```

**Key Changes:**
1. Use `createFej()` instead of singleton `Fej`
2. Pass configuration to `createFej()` instead of `setInit()`
3. Use unified `use()` method instead of `addMiddleware()` and `addAsyncMiddleware()`
4. Middleware uses `(ctx, next)` pattern instead of returning RequestInit

**Backward Compatibility:**
- Old APIs still work with deprecation warnings
- Gradual migration supported
- No breaking changes in 1.1.0

---

## Development

### Release Process

1. Update version in package.json
2. Update this CHANGELOG.md
3. Run full test suite
4. Create git tag
5. Publish to npm
6. Create GitHub release

---

## Links

- [Homepage](https://github.com/maxali/fej)
- [Issue Tracker](https://github.com/maxali/fej/issues)
- [NPM Package](https://www.npmjs.com/package/fej)
- [Documentation](https://maxali.github.io/fej/)

---

## Legend

- `Added` - New features
- `Changed` - Changes in existing functionality
- `Deprecated` - Soon-to-be removed features
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Security vulnerability fixes
