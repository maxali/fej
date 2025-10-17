# Fej v1 to v2 Migration Guide

> **Status**: Beta - v2.0-beta now available for testing
> **Last Updated**: November 2025
> **v2.0-beta Available**: `npm install fej@beta`
> **Alpha Results**: 3 projects migrated successfully, avg. 2.5 hours migration time

## Table of Contents

1. [Overview](#overview)
2. [Why Upgrade to v2?](#why-upgrade-to-v2)
3. [Timeline](#timeline)
4. [Breaking Changes](#breaking-changes)
5. [Migration Steps](#migration-steps)
6. [Automated Migration](#automated-migration)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)
9. [Getting Help](#getting-help)

---

## Overview

Fej v2 represents a significant evolution of the library, bringing modern features, better TypeScript support, and improved developer experience while maintaining the core philosophy of simplicity and zero dependencies.

### What's New in v2?

- **Named Middleware**: Organize and manage middleware with names and priorities
- **Unified API**: Single `use()` method replaces `addMiddleware()` and `addAsyncMiddleware()`
- **Instance-Based Configuration**: Create multiple independent fej instances
- **Better Error Handling**: Improved error middleware and retry mechanisms
- **AbortController Integration**: Built-in request cancellation support
- **Modern Tooling**: TypeScript 5.x strict mode, ESM + CommonJS dual package
- **Comprehensive Testing**: 100% public API test coverage
- **Better Documentation**: Complete API reference with examples

### What's Changing?

v2 introduces breaking changes to improve the API design:

- **Singleton pattern removed**: Use `createFej()` instead of singleton instance
- **Separate middleware methods unified**: `addMiddleware()` + `addAsyncMiddleware()` → `use()`
- **Configuration approach**: `setInit()` → constructor config
- **Middleware signature**: New middleware pattern with `next()` function

---

## Why Upgrade to v2?

### Benefits

- ✅ **Better DX**: Named middleware, priority ordering, and middleware removal
- ✅ **Type Safety**: Strict TypeScript mode with better type inference
- ✅ **More Features**: Error handling, retry logic, request cancellation
- ✅ **Bug Fixes**: All known v1 bugs fixed (async middleware, deep merge issues)
- ✅ **Future-Proof**: Active development, regular updates, modern tooling
- ✅ **Still Zero Dependencies**: No production dependencies added

### What You Keep

- ✅ Same core philosophy: Simple, focused fetch wrapper
- ✅ Zero dependencies: Still no production dependencies
- ✅ Small bundle size: Still <10KB (gzipped: ~3-4KB)
- ✅ Compatible with same environments: Node.js 18+, modern browsers

---

## Timeline

```
v1.5 (Current Stable)
    ↓
v1.9 (Deprecation Warnings) ← You are here
    ↓ 2 months development
v2.0-alpha (Invite Only)
    ↓ 1 month testing
v2.0-beta (Public)
    ↓ 1 month testing
v2.0-rc (Feature Freeze)
    ↓ 2 weeks validation
v2.0 (Stable Release)
```

### Support Timeline

- **v1.9**: Released with deprecation warnings
- **v1.x maintenance**:
  - Security patches: 12 months after v2.0 stable
  - Critical bug fixes: 6 months after v2.0 stable
  - No new features
- **Recommendation**: Migrate to v2.0 within 6 months of stable release

---

## Breaking Changes

### 1. Singleton Pattern → Instance-Based

**v1 (Deprecated):**

```javascript
import Fej from 'fej';

Fej.setInit({
  headers: { 'Content-Type': 'application/json' },
});

const response = await Fej.fej('/api/users');
```

**v2 (New):**

```javascript
import { createFej } from 'fej';

const api = createFej({
  baseURL: 'https://api.example.com',
  headers: { 'Content-Type': 'application/json' },
});

const response = await api.get('/users');
```

**Why?**

- Allows multiple independent instances
- Better configuration management
- No global state pollution

**Migration Impact:** Medium - Automated codemod available

---

### 2. Separate Middleware Methods → Unified `use()`

**v1 (Deprecated):**

```javascript
import Fej from 'fej';

// Sync middleware
Fej.addMiddleware((init) => {
  return { headers: { 'X-Timestamp': Date.now() } };
});

// Async middleware
Fej.addAsyncMiddleware(async (init) => {
  const token = await getToken();
  return { headers: { Authorization: `Bearer ${token}` } };
});
```

**v2 (New):**

```javascript
import { createFej } from 'fej';

const api = createFej();

// Unified middleware - handles both sync and async
api.use('auth', async (request, next) => {
  const token = await getToken();
  request.headers.set('Authorization', `Bearer ${token}`);
  await next();
  return request;
});

api.use('timestamp', async (request, next) => {
  request.headers.set('X-Timestamp', Date.now().toString());
  await next();
  return request;
});
```

**Why?**

- Simpler mental model (one concept instead of two)
- Named middleware for better organization
- Supports request AND response transformation
- Priority-based execution order

**Migration Impact:** Medium - Requires signature change, automated codemod helps

---

### 3. `setInit()` → Constructor Configuration

**v1 (Deprecated):**

```javascript
import Fej from 'fej';

Fej.setInit({
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});
```

**v2 (New):**

```javascript
import { createFej } from 'fej';

const api = createFej({
  baseURL: 'https://api.example.com',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 5000,
  retry: { attempts: 3, delay: 1000 },
});
```

**Why?**

- Clearer initialization
- All configuration in one place
- Supports new v2 options (timeout, retry, etc.)

**Migration Impact:** Low - Simple to update, automated codemod handles this

---

### 4. Middleware Signature Change

**v1 (Deprecated):**

```javascript
// Sync middleware
const middleware = (init) => {
  return { headers: { 'X-Custom': 'value' } };
};

// Async middleware
const asyncMiddleware = async (init) => {
  const token = await getToken();
  return { headers: { Authorization: `Bearer ${token}` } };
};
```

**v2 (New):**

```javascript
// Unified middleware (sync or async)
const middleware = async (request, next) => {
  // Modify request before
  request.headers.set('X-Custom', 'value');

  // Call next middleware
  await next();

  // Modify response after (optional)
  console.log('Request completed');

  return request;
};
```

**Why?**

- More powerful: Can handle both request and response phases
- Inspired by Koa middleware (proven pattern)
- Supports error handling and retry logic
- More flexible control flow

**Migration Impact:** High - Requires rewriting middleware logic

---

## Migration Steps

### Step 1: Update to v1.9 First

Before migrating to v2, update to v1.9 to see deprecation warnings:

```bash
npm install fej@1.9.0
```

Run your application and note all deprecation warnings in the console.

---

### Step 2: Review Deprecation Warnings

v1.9 will show warnings like:

```
[Fej Deprecation Warning] Fej.setInit() is deprecated and will be removed in v2.0.
Use instance-based configuration instead:
  const api = createFej({ baseURL: "...", headers: {...} });
Learn more: https://github.com/maxali/fej#v2-migration
v2.0-alpha will be released in approximately 2 months.
```

Document all locations where you use deprecated APIs.

---

### Step 3: Run Automated Codemod (Recommended)

We provide an automated migration tool that handles 80%+ of common migrations:

```bash
# Install migration tool
npm install -g @fej/migrate

# Preview changes (dry-run)
npx @fej/migrate path/to/your/code --dry-run

# Apply changes
npx @fej/migrate path/to/your/code
```

The codemod will:

- ✅ Convert `Fej.setInit()` to `createFej()`
- ✅ Replace singleton imports with instance imports
- ✅ Convert `addMiddleware()` calls to `use()`
- ✅ Update middleware signatures (basic cases)
- ⚠️ Flag complex middleware for manual review

---

### Step 4: Manual Migration (If Not Using Codemod)

#### 4.1 Update Imports

**Before:**

```javascript
import Fej from 'fej';
import { fej, addMiddleware, addAsyncMiddleware } from 'fej';
```

**After:**

```javascript
import { createFej } from 'fej';
```

#### 4.2 Create Instance

**Before:**

```javascript
Fej.setInit({
  headers: { 'Content-Type': 'application/json' },
});
```

**After:**

```javascript
const api = createFej({
  baseURL: 'https://api.example.com',
  headers: { 'Content-Type': 'application/json' },
});
```

#### 4.3 Update Middleware

**Before:**

```javascript
Fej.addMiddleware((init) => ({
  headers: { 'X-Custom': 'value' },
}));
```

**After:**

```javascript
api.use('custom-header', async (request, next) => {
  request.headers.set('X-Custom', 'value');
  await next();
  return request;
});
```

#### 4.4 Update Request Calls

**Before:**

```javascript
const response = await Fej.fej('/api/users');
```

**After:**

```javascript
const response = await api.get('/users');
// or
const response = await api.fetch('/users');
```

---

### Step 5: Update Tests

Update your test mocks and fixtures:

**Before:**

```javascript
import Fej from 'fej';

// Mock singleton
jest.mock('fej', () => ({
  default: { fej: jest.fn() },
}));
```

**After:**

```javascript
import { createFej } from 'fej';

// Mock factory function
jest.mock('fej', () => ({
  createFej: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
  })),
}));
```

---

### Step 6: Test Thoroughly

- ✅ Run all tests
- ✅ Test authentication flows
- ✅ Verify middleware execution order
- ✅ Check error handling
- ✅ Test in all target environments (browser, Node.js)

---

### Step 7: Update package.json

```bash
npm install fej@^2.0.0
```

---

### Step 8: Deploy with Monitoring

- Monitor for errors after deployment
- Check that middleware is executing correctly
- Verify request/response behavior matches v1

---

## Automated Migration

The `@fej/migrate` codemod handles most common migration patterns automatically.

### What the Codemod Handles

✅ **Automatic transformations:**

- Convert `import Fej from 'fej'` → `import { createFej } from 'fej'`
- Replace `Fej.setInit()` with `createFej()` constructor call
- Convert `Fej.addMiddleware()` → `api.use()`
- Convert `Fej.addAsyncMiddleware()` → `api.use()`
- Update simple middleware signatures
- Replace `Fej.fej()` calls with `api.get()` or `api.fetch()`

⚠️ **Manual review required:**

- Complex middleware with custom logic
- Middleware that modifies `init` in non-standard ways
- Tests that mock fej internals
- Custom error handling patterns

### Codemod Usage

```bash
# Install
npm install -g @fej/migrate

# Preview changes (recommended first step)
npx @fej/migrate src/ --dry-run

# Apply changes to specific directory
npx @fej/migrate src/

# Apply changes to entire project
npx @fej/migrate .

# Get help
npx @fej/migrate --help
```

### Codemod Output

The codemod generates a report showing:

- Files modified
- Transformations applied
- Items flagged for manual review
- Success rate

Example output:

```
✅ Transformed 12 files
✅ Updated 45 imports
✅ Migrated 23 middleware calls
⚠️  3 items require manual review (see review.txt)

Success rate: 87%
```

---

## Common Patterns

### Pattern 1: Authentication Middleware

**v1:**

```javascript
import Fej from 'fej';

Fej.addAsyncMiddleware(async (init) => {
  const token = await getAuthToken();
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
});
```

**v2:**

```javascript
import { createFej } from 'fej';

const api = createFej();

api.use(
  'auth',
  async (request, next) => {
    const token = await getAuthToken();
    request.headers.set('Authorization', `Bearer ${token}`);
    await next();
    return request;
  },
  { priority: 100 }
); // High priority = runs early
```

---

### Pattern 2: Logging Middleware

**v1:**

```javascript
import Fej from 'fej';

Fej.addMiddleware((init) => {
  console.log('Making request:', init);
  return init;
});
```

**v2:**

```javascript
import { createFej } from 'fej';

const api = createFej();

api.use('logger', async (request, next) => {
  console.log('→ Request:', request.method, request.url);
  const start = Date.now();

  await next();

  const duration = Date.now() - start;
  console.log('← Response:', duration + 'ms');
  return request;
});
```

---

### Pattern 3: Error Handling

**v1:**

```javascript
import Fej from 'fej';

try {
  const response = await Fej.fej('/api/users');
} catch (error) {
  console.error('Request failed:', error);
}
```

**v2:**

```javascript
import { createFej } from 'fej';

const api = createFej({
  retry: { attempts: 3, delay: 1000 },
});

api.use('error-handler', async (request, next) => {
  try {
    await next();
    return request;
  } catch (error) {
    if (error.status === 401) {
      await refreshToken();
      return api.retry(request);
    }
    throw error;
  }
});

const response = await api.get('/users');
```

---

### Pattern 4: Multiple Instances

**v1:**

```javascript
// Not possible - only singleton instance
import Fej from 'fej';
```

**v2:**

```javascript
import { createFej } from 'fej';

// Separate instances for different APIs
const userApi = createFej({
  baseURL: 'https://api.users.com',
  headers: { 'X-API-Key': 'user-key' },
});

const paymentApi = createFej({
  baseURL: 'https://api.payments.com',
  headers: { 'X-API-Key': 'payment-key' },
});

// Each instance has independent middleware
userApi.use('auth', userAuthMiddleware);
paymentApi.use('auth', paymentAuthMiddleware);
```

---

## Common Migration Pitfalls

### Pitfall 1: Forgetting `await next()` in Middleware

**Problem:**
```javascript
// ❌ Wrong - forgot await next()
api.use('auth', async (request, next) => {
  request.headers.set('Authorization', token);
  next(); // Missing await!
  return request;
});
```

**Solution:**
```javascript
// ✅ Correct - always await next()
api.use('auth', async (request, next) => {
  request.headers.set('Authorization', token);
  await next(); // Don't forget await!
  return request;
});
```

**Why it matters**: Without `await`, middleware won't execute in order and you'll get race conditions.

---

### Pitfall 2: Modifying Headers Incorrectly

**Problem:**
```javascript
// ❌ Wrong - trying to assign headers object
api.use('headers', async (request, next) => {
  request.headers = { 'X-Custom': 'value' }; // This doesn't work!
  await next();
  return request;
});
```

**Solution:**
```javascript
// ✅ Correct - use Headers API methods
api.use('headers', async (request, next) => {
  request.headers.set('X-Custom', 'value'); // Use .set()
  await next();
  return request;
});
```

**Why it matters**: Headers must be modified using the Headers API (`.set()`, `.append()`, `.delete()`).

---

### Pitfall 3: Middleware Priority Confusion

**Problem:**
```javascript
// ❌ Wrong order - auth runs AFTER logging
api.use('logger', logMiddleware, { priority: 100 }); // High priority
api.use('auth', authMiddleware); // Default priority (0)
// Result: Logger runs first, then auth (wrong!)
```

**Solution:**
```javascript
// ✅ Correct order - auth runs BEFORE logging
api.use('auth', authMiddleware, { priority: 100 }); // High priority
api.use('logger', logMiddleware, { priority: 50 }); // Medium priority
// Result: Auth runs first, then logger (correct!)
```

**Why it matters**: Higher priority runs *first*, not last. Auth should have highest priority.

---

### Pitfall 4: Not Returning Request from Middleware

**Problem:**
```javascript
// ❌ Wrong - forgot to return request
api.use('transform', async (request, next) => {
  request.headers.set('X-Transform', 'applied');
  await next();
  // Missing return!
});
```

**Solution:**
```javascript
// ✅ Correct - always return request
api.use('transform', async (request, next) => {
  request.headers.set('X-Transform', 'applied');
  await next();
  return request; // Don't forget to return!
});
```

**Why it matters**: Middleware must return the request object for the chain to work properly.

---

### Pitfall 5: Assuming FIFO Order Without Priorities

**Problem:**
Alpha testers expected middleware to run in the order they were added (like v1), but v2 uses priorities.

**Solution:**
```javascript
// If you want FIFO order (like v1), don't set priorities
api.use('first', middleware1); // priority: 0
api.use('second', middleware2); // priority: 0
api.use('third', middleware3); // priority: 0
// They'll run in order added: first → second → third

// Or set explicit descending priorities
api.use('first', middleware1, { priority: 100 });
api.use('second', middleware2, { priority: 90 });
api.use('third', middleware3, { priority: 80 });
```

**Why it matters**: Default priority is 0. Middleware with same priority runs in order added.

---

## Troubleshooting

### Issue: Deprecation Warnings in v1.9

**Symptom:**

```
[Fej Deprecation Warning] Fej.setInit() is deprecated...
```

**Solution:**
This is expected! v1.9 shows warnings to help you prepare for v2. Your code will continue to work. Follow the migration guide to update to v2 patterns.

---

### Issue: Middleware Not Executing in Correct Order

**Symptom:**
Auth middleware runs after other middleware, causing auth errors.

**Solution:**
Use priority parameter to control execution order:

```javascript
// High priority = runs first
api.use('auth', authMiddleware, { priority: 100 });

// Default priority = 0
api.use('logging', logMiddleware);

// Low priority = runs last
api.use('transform', transformMiddleware, { priority: -100 });
```

---

### Issue: TypeScript Errors After Migration

**Symptom:**

```
Type 'Fej' has no property 'setInit'
```

**Solution:**
Update your TypeScript imports and types:

```typescript
import { createFej, type FejInstance } from 'fej';

const api: FejInstance = createFej();
```

---

### Issue: Tests Failing After Migration

**Symptom:**
Mocks don't work, tests can't find `Fej.fej`

**Solution:**
Update your test mocks to use the new API:

```javascript
// Update mocks
jest.mock('fej', () => ({
  createFej: jest.fn(() => ({
    get: jest.fn().mockResolvedValue({ ok: true }),
    post: jest.fn().mockResolvedValue({ ok: true }),
  })),
}));

// Use in tests
import { createFej } from 'fej';
const api = createFej();
await api.get('/test');
```

---

### Issue: Bundle Size Increased

**Symptom:**
Bundle size is larger after upgrading to v2.

**Solution:**
v2 includes new features, but tree-shaking should keep typical usage under 8KB. Ensure your bundler supports tree-shaking:

```javascript
// Webpack 5 (automatic tree-shaking)
// Rollup (automatic tree-shaking)
// Vite (automatic tree-shaking)

// If not using tree-shaking, consider upgrading your build tool
```

---

## Getting Help

### Resources

- **Documentation**: https://github.com/maxali/fej
- **Migration Guide**: https://github.com/maxali/fej/blob/master/MIGRATION_GUIDE_V2.md
- **API Reference**: https://maxali.github.io/fej/
- **Changelog**: https://github.com/maxali/fej/blob/master/CHANGELOG.md

### Support Channels

- **GitHub Discussions**: Ask questions about migration
  - https://github.com/maxali/fej/discussions
  - Category: "v2 Migration"

- **GitHub Issues**: Report bugs or migration blockers
  - https://github.com/maxali/fej/issues
  - Use label: `v2-migration`

### Response Times

- **Migration questions**: 48 hours
- **Critical migration blockers**: 24 hours
- **General v2 questions**: 48-72 hours

### Community

- Share your migration experience in GitHub Discussions
- Help others who are migrating
- Report common pain points to improve the migration guide

---

## FAQ

### When should I migrate to v2?

**Recommendation**:

- Wait for v2.0-beta or v2.0-rc if you want stability
- Try v2.0-alpha if you want to provide early feedback
- Update to v1.9 now to see deprecation warnings and prepare

### Will my v1 code break immediately?

No. v2 will include a compatibility layer so v1 patterns continue to work (with warnings). However, the compatibility layer will be removed in v2.1 or v3.0, so plan to migrate within 6 months.

### How long does migration take?

**Typical timelines** (based on alpha testing results):

- Small project (<10 files): 1-2 hours ✅ Validated (Project C: 1.5h)
- Medium project (10-50 files): 3-6 hours ✅ Validated (Project A: 2h, Project B: 4h)
- Large project (50+ files): 1-2 days (Extrapolated)

**Average migration time from alpha**: 2.5 hours per project

Using the automated codemod can reduce time by 50-80%.

### Can I migrate gradually?

Yes! You can:

1. Update to v1.9 and live with warnings
2. Migrate one module/feature at a time to v2 patterns
3. Run both v1 and v2 patterns side-by-side (with warnings)
4. Complete migration when ready

### What if I find a migration blocker?

Report it immediately:

1. Open a GitHub issue with label `v2-migration-blocker`
2. Describe the blocker with code examples
3. We'll prioritize fixing migration blockers

---

## Success Stories

### Alpha Testing Results

During alpha testing (October-November 2025), we had **3 successful production migrations**:

#### Project A: REST API Client Library (250 LOC)
**Team**: Solo developer
**Migration Time**: 2 hours
**Challenges**:
- Middleware signature change
- TypeScript type adjustments

**Outcome**:
> "Migration was straightforward with the guide. The new middleware system is much more powerful. Priority ordering solved a long-standing issue we had with auth middleware."

**Learnings**: Used codemod for 80% of migration, manual adjustments for custom middleware.

---

#### Project B: Full-Stack E-commerce App (500 LOC)
**Team**: 2 developers
**Migration Time**: 4 hours
**Challenges**:
- Multiple API instances (user API, payment API)
- Complex error handling
- Testing updates

**Outcome**:
> "v2's instance-based model was exactly what we needed. We can now have separate configs for different API endpoints. Error middleware is a game-changer."

**Learnings**: Breaking migration into phases (one API at a time) worked well.

---

#### Project C: GraphQL Client Wrapper (150 LOC)
**Team**: Solo developer
**Migration Time**: 1.5 hours
**Challenges**:
- GraphQL-specific headers
- Request transformation logic

**Outcome**:
> "Fastest migration I've ever done. The codemod handled most of it. New middleware API is cleaner than v1. Bundle size stayed under 8KB."

**Learnings**: Simple projects benefit most from automated migration.

---

### Key Takeaways from Alpha Migrations

**What Went Well:**
- ✅ Codemod handled 80%+ of common patterns
- ✅ Migration guide was clear and actionable
- ✅ Middleware power increase justified the changes
- ✅ TypeScript support was excellent
- ✅ No production issues post-migration

**Common Patterns:**
- Most migrations took 1.5-4 hours
- Breaking into phases reduced risk
- Testing was crucial post-migration
- Documentation was referenced frequently

**Recommendations:**
1. Start with smallest modules first
2. Use codemod for initial pass
3. Review middleware logic carefully
4. Test thoroughly before production deploy
5. Keep migration guide open during process

---

## Feedback

This migration guide is a living document. If you find:

- Missing information
- Confusing instructions
- Common patterns not covered
- Errors or inaccuracies

Please open an issue or PR to improve this guide for everyone.

---

**Last Updated**: October 2025
**Guide Version**: 1.0.0 (Draft)
**Target v2 Version**: 2.0.0
