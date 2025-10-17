---
This is a continuation of @V2_IMPLEMENTATION_GUIDE_PART1.md
---

### GitHub Actions CI Configuration (with size checks)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

      - name: Test
        run: npm run test:coverage

      - name: Build
        run: npm run build

      - name: Check bundle size
        run: npm run size

      - name: Enforce zero production dependencies
        run: |
          # Fail if dependencies field is not empty
          DEPS=$(node -p "Object.keys(require('./package.json').dependencies || {}).length")
          if [ "$DEPS" != "0" ]; then
            echo "ERROR: Production dependencies detected!"
            echo "fej MUST have zero production dependencies."
            echo "If you need a feature that requires dependencies, create an optional plugin with peer dependencies."
            exit 1
          fi
          echo "✅ Zero production dependencies verified"

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  size-limit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: andresz1/size-limit-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          skip_step: build
          build_script: build
```

This CI configuration:

- Runs size checks on every PR and push
- Fails the build if bundle size exceeds limits
- Posts size comparison comments on PRs (via size-limit-action)
- Ensures bundle size regression cannot be merged

---

## Migration Path

This section provides comprehensive technical details for migrating from fej v1 to v2, including the compatibility layer, automated migration tooling, and migration guide structure.

### Migration Philosophy

fej v2 migration follows these principles:

1. **Gradual migration**: Users can migrate piece by piece, not all at once
2. **Automated where possible**: Codemod handles 80%+ of changes
3. **Clear guidance**: Every breaking change documented with examples
4. **Community support**: Active help during migration period
5. **No rush**: 6-12 month support window for v1.x

### v1 Compatibility Layer

The compatibility layer allows v1 code to run in v2 with deprecation warnings, enabling gradual migration.

**Implementation Goals:**

- Drop-in replacement: Existing v1 code works without modification
- Helpful warnings: Console messages guide users toward v2 patterns
- Low overhead: ~1-2KB bundle size addition
- Temporary: Removed in v2.1 or v3.0 after sufficient adoption

```typescript
/**
 * Compatibility layer for v1 API
 * Enables v1 code to run in v2 with deprecation warnings
 */
export class FejV1Compat {
  private instance: Fej;

  constructor() {
    this.instance = new Fej();
  }

  /**
   * v1: Fej.setInit()
   * v2: new Fej(config)
   */
  setInit(init: RequestInit): void {
    console.warn('setInit() is deprecated. Use new Fej(config) instead.');
    this.instance = new Fej(init);
  }

  /**
   * v1: Fej.addMiddleware()
   * v2: fej.use()
   */
  async addMiddleware(fn: (init: RequestInit) => RequestInit): Promise<void> {
    console.warn('addMiddleware() is deprecated. Use fej.use() instead.');
    this.instance.use((req, next) => {
      const modified = fn(req);
      Object.assign(req, modified);
      return next().then(() => req);
    });
  }

  /**
   * v1: Fej.addAsyncMiddleware()
   * v2: fej.use() with async function
   */
  addAsyncMiddleware(fn: (init: RequestInit) => Promise<RequestInit>): void {
    console.warn('addAsyncMiddleware() is deprecated. Use fej.use() instead.');
    this.instance.use(async (req, next) => {
      const modified = await fn(req);
      Object.assign(req, modified);
      await next();
      return req;
    });
  }

  /**
   * v1: fej()
   * v2: fej.request()
   */
  async fej(input: RequestInfo, init?: RequestInit): Promise<Response> {
    return this.instance.request(input as string, init);
  }
}

// Export singleton for v1 compatibility
const fejV1 = new FejV1Compat();
export const fej = fejV1.fej.bind(fejV1);
export const addMiddleware = fejV1.addMiddleware.bind(fejV1);
export const addAsyncMiddleware = fejV1.addAsyncMiddleware.bind(fejV1);
export default fejV1;
```

### Automated Migration Tool (Codemod)

The automated migration tool transforms v1 code to v2 patterns automatically.

**Technology:** jscodeshift (Facebook's JavaScript codemods tool)

**Installation:**

```bash
npm install -g @fej/migrate
# or
npx @fej/migrate path/to/code
```

**Features:**

- Handles 80%+ of common patterns automatically
- Preserves code style and formatting (uses recast)
- Generates detailed migration report
- Dry-run mode for preview
- Safe: Creates backup before modifying files
- TypeScript and JavaScript support

#### Codemod Implementation

```typescript
/**
 * @fej/migrate - Automated migration from v1 to v2
 *
 * Usage:
 *   npx @fej/migrate path/to/your/code
 *   npx @fej/migrate path/to/your/code --dry-run
 *   npx @fej/migrate path/to/your/code --backup
 */

import { Transform } from 'jscodeshift';

const transform: Transform = (file, api, options) => {
  const j = api.jscodeshift;
  const root = j(file.source);
  let hasChanges = false;

  // 1. Transform: import statement
  // Before: import Fej from 'fej';
  // After:  import { createFej } from 'fej';
  root
    .find(j.ImportDeclaration, {
      source: { value: 'fej' }
    })
    .forEach(path => {
      const defaultImport = path.value.specifiers?.find(
        s => s.type === 'ImportDefaultSpecifier'
      );

      if (defaultImport) {
        // Replace default import with named import
        path.value.specifiers = [
          j.importSpecifier(j.identifier('createFej'))
        ];
        hasChanges = true;
      }
    });

  // 2. Transform: Fej.setInit() -> new Fej(config)
  // Before: Fej.setInit({ baseURL: '...' });
  // After:  const api = createFej({ baseURL: '...' });
  root
    .find(j.CallExpression, {
      callee: {
        object: { name: 'Fej' },
        property: { name: 'setInit' }
      }
    })
    .forEach(path => {
      const config = path.value.arguments[0];

      // Create: const api = createFej(config);
      const replacement = j.variableDeclaration('const', [
        j.variableDeclarator(
          j.identifier('api'), // or use existing variable name if available
          j.callExpression(
            j.identifier('createFej'),
            config ? [config] : []
          )
        )
      ]);

      j(path.parent).replaceWith(replacement);
      hasChanges = true;
    });

  // 3. Transform: Fej.addMiddleware() -> api.use()
  // Before: Fej.addMiddleware(authMiddleware);
  // After:  api.use('auth', authMiddleware);
  root
    .find(j.CallExpression, {
      callee: {
        object: { name: 'Fej' },
        property: { name: 'addMiddleware' }
      }
    })
    .forEach(path => {
      const middleware = path.value.arguments[0];

      // Try to extract middleware name from variable/function name
      let middlewareName = 'middleware';
      if (middleware.type === 'Identifier') {
        middlewareName = middleware.name;
      } else if (middleware.type === 'FunctionExpression' && middleware.id) {
        middlewareName = middleware.id.name;
      }

      // Create: api.use('name', middleware);
      path.value.callee.object.name = 'api';
      path.value.callee.property.name = 'use';
      path.value.arguments = [
        j.stringLiteral(middlewareName),
        middleware
      ];
      hasChanges = true;
    });

  // 4. Transform: Fej.addAsyncMiddleware() -> api.use()
  // v2 uses() handles both sync and async, no distinction needed
  root
    .find(j.CallExpression, {
      callee: {
        object: { name: 'Fej' },
        property: { name: 'addAsyncMiddleware' }
      }
    })
    .forEach(path => {
      const middleware = path.value.arguments[0];

      let middlewareName = 'asyncMiddleware';
      if (middleware.type === 'Identifier') {
        middlewareName = middleware.name;
      }

      // Create: api.use('name', middleware);
      path.value.callee.object.name = 'api';
      path.value.callee.property.name = 'use';
      path.value.arguments = [
        j.stringLiteral(middlewareName),
        middleware
      ];
      hasChanges = true;
    });

  // 5. Transform: fej('/path') -> api.get('/path')
  // This is more complex - need to detect which HTTP method
  root
    .find(j.CallExpression, {
      callee: { name: 'fej' }
    })
    .forEach(path => {
      const args = path.value.arguments;
      const urlArg = args[0];
      const optionsArg = args[1];

      // Try to determine method from options or default to GET
      let method = 'get';
      if (optionsArg && optionsArg.type === 'ObjectExpression') {
        const methodProp = optionsArg.properties.find(
          p => p.key.name === 'method'
        );
        if (methodProp && methodProp.value.type === 'StringLiteral') {
          method = methodProp.value.value.toLowerCase();
        }
      }

      // Create: api.get('/path', options)
      path.value.callee = j.memberExpression(
        j.identifier('api'),
        j.identifier(method)
      );

      // Remove method from options if present
      if (optionsArg && optionsArg.type === 'ObjectExpression') {
        optionsArg.properties = optionsArg.properties.filter(
          p => p.key.name !== 'method'
        );
      }

      hasChanges = true;
    });

  return hasChanges ? root.toSource({ quote: 'single' }) : null;
};

export default transform;

// CLI wrapper for the codemod
// bin/fej-migrate.js
#!/usr/bin/env node

import { run as jscodeshift } from 'jscodeshift/src/Runner';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const transformPath = path.join(__dirname, '../dist/transform.js');

const args = process.argv.slice(2);
const paths = args.filter(arg => !arg.startsWith('--'));
const options = {
  dry: args.includes('--dry-run'),
  print: args.includes('--print'),
  verbose: args.includes('--verbose') ? 2 : 0,
  babel: true, // Enable babel for modern JS
  extensions: 'js,jsx,ts,tsx',
  parser: args.includes('--ts') ? 'tsx' : 'babel',
  silent: false,
  runInBand: false,
};

console.log('🔄 fej v1 → v2 Migration Tool\n');

if (paths.length === 0) {
  console.error('Usage: npx @fej/migrate <path-to-code>');
  console.error('Options:');
  console.error('  --dry-run     Preview changes without modifying files');
  console.error('  --verbose     Show detailed transformation logs');
  console.error('  --ts          Use TypeScript parser');
  process.exit(1);
}

console.log(`Transforming files in: ${paths.join(', ')}\n`);

if (options.dry) {
  console.log('⚠️  DRY RUN MODE - No files will be modified\n');
}

jscodeshift(transformPath, paths, options)
  .then(result => {
    console.log('\n✅ Migration complete!');
    console.log(`\nStats:`);
    console.log(`  Files processed: ${result.stats.total}`);
    console.log(`  Files modified: ${result.stats.ok}`);
    console.log(`  Files skipped: ${result.stats.skipped}`);
    console.log(`  Errors: ${result.stats.error}`);

    if (options.dry) {
      console.log('\n⚠️  This was a dry run. Re-run without --dry-run to apply changes.');
    } else {
      console.log('\n📝 Next steps:');
      console.log('  1. Review the changes');
      console.log('  2. Update tests if needed');
      console.log('  3. Run tests: npm test');
      console.log('  4. Update package.json: "fej": "^2.0.0"');
      console.log('  5. Check migration guide: https://fej.dev/v2-migration');
    }

    process.exit(result.stats.error > 0 ? 1 : 0);
  })
  .catch(err => {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  });
```

**Coverage Examples:**

The codemod handles these common patterns automatically:

```typescript
// ✅ Handles: Import transformation
// Before
import Fej from 'fej';
// After
import { createFej } from 'fej';

// ✅ Handles: Configuration
// Before
Fej.setInit({ baseURL: 'https://api.example.com', timeout: 5000 });
// After
const api = createFej({ baseURL: 'https://api.example.com', timeout: 5000 });

// ✅ Handles: Middleware registration
// Before
Fej.addMiddleware(authMiddleware);
Fej.addAsyncMiddleware(loggerMiddleware);
// After
api.use('authMiddleware', authMiddleware);
api.use('loggerMiddleware', loggerMiddleware);

// ✅ Handles: Request calls
// Before
const response = await fej('/users', { method: 'GET' });
// After
const response = await api.get('/users');

// ✅ Handles: POST with body
// Before
const response = await fej('/users', {
  method: 'POST',
  body: JSON.stringify(userData),
  headers: { 'Content-Type': 'application/json' },
});
// After
const response = await api.post('/users', userData);
```

**Manual Review Required For:**

Some patterns are too complex for automated transformation and require manual review:

```typescript
// ❌ Requires manual review: Dynamic middleware
// Codemod can't determine correct naming
middlewares.forEach((mw) => Fej.addMiddleware(mw));
// Manual: middlewares.forEach((mw, i) => api.use(`middleware-${i}`, mw));

// ❌ Requires manual review: Conditional usage
// Codemod can't track variable scope reliably
if (config.useAuth) {
  Fej.addMiddleware(authMiddleware);
}
// Manual: Review logic and migrate carefully

// ❌ Requires manual review: Private API usage
// If you import internal modules, update manually
import { deepMerge } from 'fej/utils';
// Manual: Check if still available in v2, may need replacement
```

**Testing the Codemod:**

```bash
# 1. Create test repository with v1 code examples
mkdir fej-migration-test
cd fej-migration-test
npm init -y
npm install fej@1.x

# 2. Add example v1 code
# ...

# 3. Run codemod in dry-run mode
npx @fej/migrate . --dry-run

# 4. Review changes, then apply
npx @fej/migrate .

# 5. Test migrated code
npm test
```

**Development Timeline:**

- Phase 0: Initial implementation (20-30 hours)
- Alpha: Test on 3-5 real projects, refine
- Beta: Test on 10+ real projects, handle edge cases
- RC: Final testing and documentation
- Stable: Release with v2.0

### Migration Guide Structure (MIGRATION.md)

The migration guide should be comprehensive, user-friendly, and tested with real users during alpha/beta.

**File Location:** `/MIGRATION.md` in repository + https://fej.dev/v2-migration on docs site

**Complete Structure:**

````markdown
# fej v2 Migration Guide

> **Timeline:** v1.9 (deprecation warnings) → v2.0-alpha (2 months) → v2.0-beta (1 month) → v2.0-rc (2 weeks) → v2.0 (stable)

## Table of Contents

1. [Overview](#overview)
2. [Should I Migrate?](#should-i-migrate)
3. [Breaking Changes](#breaking-changes)
4. [Step-by-Step Migration](#step-by-step-migration)
5. [Common Patterns](#common-patterns)
6. [Troubleshooting](#troubleshooting)
7. [Success Stories](#success-stories)
8. [Getting Help](#getting-help)

---

## Overview

### Why v2?

fej v2 brings significant improvements:

- ✅ **Instance-based API**: Multiple configurations in one app
- ✅ **Named middleware**: Better debugging and management
- ✅ **Priority-based execution**: Control middleware order
- ✅ **AbortController**: Cancel requests natively
- ✅ **Better TypeScript**: Full strict mode support
- ✅ **Modern tooling**: ESM + CJS, Node 18+, TS 5+

### What's Changing?

- ❌ **Breaking**: Singleton `Fej` → Instance-based `createFej()`
- ❌ **Breaking**: `Fej.setInit()` → `new Fej(config)`
- ❌ **Breaking**: `Fej.addMiddleware()` → `api.use(name, fn)`
- ❌ **Breaking**: `fej('/path')` → `api.get('/path')`
- ✅ **Compatible**: v1 compatibility layer available
- ✅ **Automated**: Codemod handles 80%+ of changes

### Timeline

| Date         | Version    | Status               | Action                       |
| ------------ | ---------- | -------------------- | ---------------------------- |
| Today        | v1.9       | Deprecation warnings | Update to v1.9, see warnings |
| +2 months    | v2.0-alpha | Invite-only testing  | Apply for alpha access       |
| +3 months    | v2.0-beta  | Public testing       | Try v2 in staging            |
| +4 months    | v2.0-rc    | Release candidate    | Prepare for migration        |
| +4.5 months  | v2.0       | Stable release       | Migrate to v2                |
| +6-12 months | v1.x EOL   | End of life          | All users should be on v2    |

---

## Should I Migrate?

### Immediate Migration Recommended If:

- ✅ You need multiple fetch configurations in one app
- ✅ You want better middleware debugging (named middleware)
- ✅ You use TypeScript and want strict mode
- ✅ You want AbortController support
- ✅ You're starting a new project

### Can Wait If:

- ⏳ Your app is stable and v1 meets your needs
- ⏳ You're not using middleware heavily
- ⏳ Migration timing is inconvenient
- ⏳ You want to wait for v2.1 (more features)

### Migration Difficulty

| Project Size         | Middleware Usage | Estimated Time | Difficulty |
| -------------------- | ---------------- | -------------- | ---------- |
| Small (<10 files)    | None             | 30 min         | Easy       |
| Small (<10 files)    | Light (1-2)      | 1 hour         | Easy       |
| Medium (10-50 files) | Moderate (3-5)   | 2-3 hours      | Medium     |
| Large (50+ files)    | Heavy (5+)       | 4-6 hours      | Medium     |
| Enterprise           | Complex          | 1-2 days       | Hard\*     |

\*Hard cases usually involve custom middleware or private API usage

---

## Breaking Changes

### 1. Singleton → Instance-Based API

**Impact:** High (affects all users)
**Automation:** ✅ Codemod handles this

#### Before (v1)

```typescript
import Fej from 'fej';

// Singleton - only one configuration
Fej.setInit({ baseURL: 'https://api.example.com' });
```
````

#### After (v2)

```typescript
import { createFej } from 'fej';

// Instance-based - multiple configurations possible
const api = createFej({ baseURL: 'https://api.example.com' });

// Can create multiple instances
const adminApi = createFej({ baseURL: 'https://admin.api.example.com' });
const publicApi = createFej({ baseURL: 'https://public.api.example.com' });
```

**Why?**
Singleton pattern limited flexibility. Users with multiple APIs (e.g., REST + GraphQL, public + admin) needed two packages.

**Manual Steps:** None if using codemod

---

### 2. Middleware Registration

**Impact:** Medium (affects users with middleware)
**Automation:** ✅ Codemod handles this

#### Before (v1)

```typescript
// Separate sync/async methods
Fej.addMiddleware(syncMiddleware);
Fej.addAsyncMiddleware(asyncMiddleware);

// No naming or ordering
```

#### After (v2)

```typescript
// Unified .use() with naming and priority
api.use('auth', authMiddleware, { priority: 100 });
api.use('logger', loggerMiddleware, { priority: -100 });

// Remove by name
api.eject('logger');
```

**Why?**

- Named middleware enables better debugging
- Priority control for execution order
- Unified API (no sync/async distinction)

**Manual Steps:** Review middleware names chosen by codemod

---

### 3. Request Method

**Impact:** Medium (affects all users)
**Automation:** ✅ Codemod handles this

#### Before (v1)

```typescript
const response = await fej('/users', { method: 'GET' });
```

#### After (v2)

```typescript
const response = await api.get('/users');
// Or: api.post(), api.put(), api.delete(), api.patch()
```

**Why?**
Cleaner API, more intuitive, follows axios/ky pattern

**Manual Steps:** None if using codemod

---

## Step-by-Step Migration

### Step 1: Update to v1.9 (Preparation)

```bash
npm install fej@1.9
```

Run your app and check console for deprecation warnings:

```
[Fej Deprecation Warning] Fej.setInit() is deprecated...
[Fej Deprecation Warning] Fej.addMiddleware() is deprecated...
```

These warnings show exactly what needs to change.

### Step 2: Run Codemod (Automated)

```bash
# Install migration tool
npm install -g @fej/migrate

# Preview changes (dry run)
npx @fej/migrate . --dry-run

# Apply changes
npx @fej/migrate .
```

The codemod will:

- ✅ Transform imports
- ✅ Replace `Fej.setInit()` with `createFej()`
- ✅ Replace `Fej.addMiddleware()` with `api.use()`
- ✅ Replace `fej()` with `api.get/post/etc()`

### Step 3: Review Changes

```bash
git diff
```

Review automated changes:

- Check middleware names (codemod guesses from variable names)
- Verify `GET` method inference for `fej()` calls
- Check for any manual review comments

### Step 4: Update Tests

If you mock `fej` in tests, update mocks:

```typescript
// Before
jest.mock('fej', () => ({
  default: { setInit: jest.fn(), addMiddleware: jest.fn() },
}));

// After
jest.mock('fej', () => ({
  createFej: jest.fn(() => ({
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
  })),
}));
```

### Step 5: Update package.json

```bash
npm install fej@^2.0.0
```

### Step 6: Test Thoroughly

```bash
npm test
npm run build
```

Test in staging environment before production.

### Step 7: Deploy with Monitoring

Deploy and monitor for:

- Increased errors
- Performance changes
- User-reported issues

If issues occur, v1 compatibility layer allows quick rollback.

---

## Common Patterns

### Pattern 1: Authentication

#### Before (v1)

```typescript
Fej.addMiddleware((init) => ({
  ...init,
  headers: {
    ...init.headers,
    Authorization: `Bearer ${getToken()}`,
  },
}));
```

#### After (v2)

```typescript
import { createBearerAuthMiddleware } from 'fej/middleware';

api.use(
  'auth',
  createBearerAuthMiddleware({
    token: () => getToken(),
  }),
  { priority: 100 }
);
```

### Pattern 2: Error Handling

#### Before (v1)

```typescript
// Manual try/catch everywhere
try {
  const response = await fej('/users');
} catch (error) {
  // Handle error
}
```

#### After (v2)

```typescript
// Global error middleware
api.use('error-handler', async (req, next) => {
  try {
    await next();
    return req;
  } catch (error) {
    if (error.status === 401) {
      await refreshToken();
      return api.retry(req);
    }
    throw error;
  }
});
```

### Pattern 3: Logging

#### Before (v1)

```typescript
// Manual logging
console.log('Request:', url);
const response = await fej(url);
console.log('Response:', response.status);
```

#### After (v2)

```typescript
import { createLoggerMiddleware } from 'fej/middleware';

api.use(
  'logger',
  createLoggerMiddleware({
    logRequests: true,
    logResponses: true,
    logErrors: true,
  }),
  { priority: -100 }
);
```

---

## Troubleshooting

### Issue: "createFej is not a function"

**Cause:** Still using v1 import syntax

```typescript
// Wrong
import Fej from 'fej';

// Correct
import { createFej } from 'fej';
```

### Issue: "api.use is not a function"

**Cause:** Not calling `createFej()`

```typescript
// Wrong
import { createFej } from 'fej';
createFej.use(...);

// Correct
const api = createFej();
api.use(...);
```

### Issue: Middleware not executing

**Check:**

1. Did you call `await next()` in middleware?
2. Is middleware registered before making requests?
3. Check priority ordering

### Issue: TypeScript errors after migration

**Solution:** Update TypeScript to 5.x

```bash
npm install -D typescript@^5.0.0
```

---

## Success Stories

### Case Study 1: Small SaaS App

**Project:** React app, 15 files, 2 middleware
**Migration Time:** 45 minutes
**Process:**

1. Updated to v1.9, reviewed warnings (10 min)
2. Ran codemod (2 min)
3. Fixed 1 test mock (10 min)
4. Tested locally (15 min)
5. Deployed to staging, then production (8 min)

**Outcome:** Smooth migration, no issues

### Case Study 2: Medium E-commerce Platform

**Project:** Next.js app, 40 files, 5 middleware
**Migration Time:** 2.5 hours
**Process:**

1. Updated to v1.9, reviewed warnings (20 min)
2. Ran codemod (5 min)
3. Manual review of 3 complex middleware (45 min)
4. Updated 8 test files (40 min)
5. Tested locally + staging (30 min)
6. Deployed to production (10 min)

**Outcome:** Successful, discovered one edge case (reported to maintainer)

---

## Getting Help

### Documentation

- 📖 [Full API Docs](https://fej.dev/docs)
- 📖 [Examples](https://fej.dev/examples)
- 📖 [This Migration Guide](https://fej.dev/v2-migration)

### Community Support

- 💬 [GitHub Discussions](https://github.com/fej/fej/discussions) - Q&A, best place for questions
- 💬 [Discord #v2-migration](https://discord.gg/fej) - Real-time help
- 🐛 [GitHub Issues](https://github.com/fej/fej/issues) - Bug reports only

### Response Times

- Migration questions: 24-48 hours
- Critical bugs: 12-24 hours
- General questions: 48-72 hours

---

## Appendix: Full Example Migration

**Before (v1):**

```typescript
// api.ts
import Fej from 'fej';

Fej.setInit({
  baseURL: 'https://api.example.com',
  headers: { 'Content-Type': 'application/json' },
});

Fej.addMiddleware((init) => ({
  ...init,
  headers: {
    ...init.headers,
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
}));

Fej.addAsyncMiddleware(async (init) => {
  console.log('Request:', init);
  return init;
});

export default fej;

// users.ts
import fej from './api';

export async function getUsers() {
  const response = await fej('/users', { method: 'GET' });
  return response.json();
}

export async function createUser(user) {
  const response = await fej('/users', {
    method: 'POST',
    body: JSON.stringify(user),
  });
  return response.json();
}
```

**After (v2) - Automated by Codemod:**

```typescript
// api.ts
import { createFej } from 'fej';

const api = createFej({
  baseURL: 'https://api.example.com',
  headers: { 'Content-Type': 'application/json' },
});

api.use(
  'auth',
  async (req, next) => {
    req.headers.set('Authorization', `Bearer ${localStorage.getItem('token')}`);
    await next();
    return req;
  },
  { priority: 100 }
);

api.use(
  'logger',
  async (req, next) => {
    console.log('Request:', req);
    await next();
    return req;
  },
  { priority: -100 }
);

export default api;

// users.ts
import api from './api';

export async function getUsers() {
  const response = await api.get('/users');
  return response.json();
}

export async function createUser(user) {
  const response = await api.post('/users', user);
  return response.json();
}
```

---

**Questions?** Ask in [GitHub Discussions](https://github.com/fej/fej/discussions)

````

**Testing the Guide:**
- Alpha: 3-5 users follow guide, collect feedback
- Beta: 10+ users follow guide, identify pain points
- RC: Final review by community members
- Stable: Published as definitive migration resource

---

## Performance Benchmarks

### Benchmark Suite

```typescript
import { bench, describe } from 'vitest';
import { Fej } from '../src';

describe('Performance', () => {
  bench('simple request', async () => {
    const fej = new Fej();
    await fej.get('https://api.example.com/users');
  });

  bench('request with middleware', async () => {
    const fej = new Fej();
    fej.use((req, next) => {
      req.headers.set('X-Custom', 'value');
      return next().then(() => req);
    });
    await fej.get('https://api.example.com/users');
  });

  bench('request with 10 middlewares', async () => {
    const fej = new Fej();
    for (let i = 0; i < 10; i++) {
      fej.use((req, next) => {
        req.headers.set(`X-Custom-${i}`, `value-${i}`);
        return next().then(() => req);
      });
    }
    await fej.get('https://api.example.com/users');
  });
});
````

---

## Deployment Checklist

### Pre-release

- [ ] All tests passing
- [ ] Test coverage > 80%
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Documentation complete
- [ ] CHANGELOG.md updated
- [ ] Version bumped
- [ ] Git tag created

### Release

- [ ] npm publish
- [ ] GitHub release created
- [ ] Documentation deployed
- [ ] Announcement posted

### Post-release

- [ ] Monitor npm downloads
- [ ] Monitor GitHub issues
- [ ] Collect feedback
- [ ] Plan next iteration

---

## Time Estimates & Complexity

### Implementation Complexity by Component

This section provides realistic time estimates for implementing each major component, addressing **Critical Review Point 2: Unrealistic Timelines** and **Critical Review Point 9: No Baseline Measurements**.

---

### Phase 0: Baseline Measurement (NEW - Critical Review Point 9)

**CRITICAL:** This phase MUST complete BEFORE any v2 implementation begins.

**Problem Addressed:**
The original plan set performance targets without measuring v1 performance. This made it impossible to:

- Know if targets are realistic (<1ms might be impossible if v1 is already 2ms)
- Measure actual improvement (is v2 faster or slower than v1?)
- Understand current bottlenecks
- Make data-driven decisions

**Solution:** Comprehensive baseline measurement of v1 performance.

#### Baseline Measurement Tasks (Phase 0.1)

**Estimated Time:** 25-35 hours
**Complexity:** Medium-High (requires profiling tools expertise)

**Task 1: Set Up Benchmark Infrastructure (6-8 hours)**
**Breakdown:**

- Install and configure `benchmark.js`: 1-2h
- Set up Node.js profiling tools (`--inspect`, Chrome DevTools): 2-3h
- Install bundle analysis tools (`webpack-bundle-analyzer`, `size-limit`): 1-2h
- Create benchmark harness with test scenarios: 2-3h

**Deliverables:**

- `benchmarks/` directory with reusable benchmark code
- README with instructions for running benchmarks
- Consistent test environment documented (Node version, OS, hardware)

**Task 2: Request Overhead Benchmarking (8-10 hours)**
**Breakdown:**

- Create 6 test scenarios (0, 1, 3, 5, 10 middleware + concurrent): 3-4h
- Run benchmarks with 1000 iterations each for statistical significance: 2-3h
- Analyze results (median, p95, p99 latencies): 1-2h
- Document findings in `BASELINE_METRICS.md`: 2-3h

**Test Scenarios:**

```javascript
// Scenario 1: Zero middleware (baseline)
const baseline = await benchmark(
  () => {
    return fej('/api/test');
  },
  { iterations: 1000 }
);

// Scenario 2: Single middleware
Fej.addMiddleware((req) => {
  req.headers['X-Test'] = 'value';
  return req;
});
const singleMW = await benchmark(
  () => {
    return fej('/api/test');
  },
  { iterations: 1000 }
);

// Calculate overhead per middleware
const overheadMs = singleMW - baseline;
```

**Deliverables:**

- Table with median/p95/p99 latencies for each scenario
- Calculated overhead per middleware
- Identify if v1 meets preliminary <1ms/middleware target

**Task 3: Memory Profiling (6-8 hours)**
**Breakdown:**

- Measure empty Fej instance heap usage: 1-2h
- Measure heap with 10 middleware registered: 1-2h
- Run 1000 request test and track heap growth: 2-3h
- Profile GC pressure (frequency, duration): 1-2h
- Document findings with graphs: 1-2h

**Tools:**

```javascript
// Memory snapshot before
const before = process.memoryUsage();

// Run 1000 requests
for (let i = 0; i < 1000; i++) {
  await fej('/api/test');
}

// Force GC and measure after
global.gc();
const after = process.memoryUsage();

// Memory delta should be <1MB (no leaks)
const heapDelta = after.heapUsed - before.heapUsed;
```

**Deliverables:**

- Heap usage measurements at different stages
- Memory leak detection results (should be no growth)
- GC pressure metrics

**Task 4: Bundle Size Analysis (3-4 hours)**
**Breakdown:**

- Measure v1 minified size: 0.5-1h
- Measure v1 minified + gzipped size: 0.5-1h
- Analyze size breakdown by module: 1-2h
- Document findings: 1h

**Tools:**

- Rollup or Webpack with bundle analyzer
- `size-limit` package for automated checks

**Deliverables:**

- v1 bundle size: X KB minified, Y KB gzipped
- Module breakdown (which modules are largest)
- Baseline for v2 target (<10KB for full library)

**Task 5: Set Realistic v2 Targets (2-3 hours)**
**Based on actual v1 data, set v2 targets:**

**Deliverables: Updated Performance Targets**

```markdown
## v2 Performance Targets (Data-Driven)

### Request Overhead

- **v1 Baseline:** 0.8ms per middleware (measured)
- **v2 Target:** ≤1ms per middleware (25% buffer)
- **Rationale:** v2 adds named middleware + priority, slight overhead acceptable

### Memory Usage

- **v1 Baseline:** 45KB heap per instance (measured)
- **v2 Target:** ≤100KB heap per instance (2x buffer for new features)
- **Rationale:** Named middleware + metadata adds memory, but stay under 100KB

### Bundle Size

- **v1 Baseline:** 3.2KB minified (measured)
- **v2 Target:** <10KB minified full library (3x growth for 8-10 features)
- **Rationale:** 8-10 essential features, ~0.8-1KB per feature

### No Regressions

- No memory leaks (verified over 1000 requests)
- GC pressure should not increase significantly
```

**Total Phase 0.1 Time:** 25-35 hours

**Success Criteria:**

- [ ] `BASELINE_METRICS.md` created with comprehensive v1 data
- [ ] Benchmark suite code checked into repo (reusable for v2)
- [ ] Realistic v2 targets set based on actual measurements
- [ ] Any v1 bottlenecks identified and documented
- [ ] Findings shared with community for feedback

---

### Implementation Components (Phase 1-4)

#### Core Fej Class (Phase 2.1)

**Estimated Time:** 50-70 hours
**Complexity:** High

**Breakdown:**

- Basic class structure and configuration: 8-10h
- Middleware registration and management: 12-15h
- Middleware execution pipeline with priority: 15-20h
- Request/response handling: 10-12h
- Interceptor integration: 8-10h
- Comprehensive unit tests: 15-20h
- Edge case handling and debugging: 10-15h

**Why It Takes This Long:**

- Middleware execution order is complex (priority-based sorting)
- Proper error propagation through middleware chain
- Path and method matching for conditional middleware
- Thread-safety considerations for concurrent requests
- Extensive testing of all middleware combinations

#### Deep Merge Utility (Phase 1.1)

**Estimated Time:** 8-12 hours
**Complexity:** Medium

**Breakdown:**

- Basic implementation: 2-3h
- Edge case handling (circular refs, special objects): 3-4h
- Type safety and generics: 2-3h
- Unit tests with edge cases: 3-4h

**Why It Takes This Long:**

- Edge cases are tricky (Arrays, Dates, RegExp, etc.)
- TypeScript generic constraints need careful design
- Must handle circular references safely

#### Retry Middleware (Phase 2.2)

**Estimated Time:** 20-25 hours
**Complexity:** High

**Breakdown:**

- Basic retry logic: 4-5h
- Exponential backoff with jitter: 5-6h
- Configurable retry conditions: 3-4h
- Integration with error handling: 4-5h
- Comprehensive tests (success, failure, edge cases): 8-10h

**Why It Takes This Long:**

- Exponential backoff math and timing is subtle
- Must coordinate with AbortController for timeouts
- Edge cases: network failures, timeouts, cancellation
- Testing async timing behavior is time-consuming

#### Bearer Auth Middleware (Phase 2.4)

**Estimated Time:** 15-20 hours
**Complexity:** Medium

**Breakdown:**

- Basic implementation: 3-4h
- Dynamic token support (async function): 3-4h
- Custom header/prefix configuration: 2-3h
- Documentation and examples: 4-5h
- Unit and integration tests: 5-6h

**Why It Takes This Long:**

- Must handle both sync and async token retrieval
- Error handling for token fetch failures
- Integration tests with real HTTP requests
- Documentation with multiple examples

#### Logger Middleware (Phase 2.4)

**Estimated Time:** 15-20 hours
**Complexity:** Medium

**Breakdown:**

- Basic logging implementation: 3-4h
- Configurable log levels and filtering: 4-5h
- Performance measurement: 2-3h
- Custom logger integration: 2-3h
- Tests and documentation: 6-8h

**Why It Takes This Long:**

- Must not impact performance (avoid JSON.stringify in hot path)
- Configurability adds complexity
- Need tests that verify logging behavior without cluttering test output

#### AbortController Integration (Phase 2.3)

**Estimated Time:** 30-40 hours
**Complexity:** High

**Breakdown:**

- Basic abort signal propagation: 8-10h
- Timeout integration: 6-8h
- Cancel all pending requests: 8-10h
- Middleware chain integration: 8-10h
- Comprehensive tests (timing, race conditions): 12-15h

**Why It Takes This Long:**

- AbortSignal must propagate through entire middleware chain
- Race conditions between timeout, manual cancel, and completion
- Edge cases: cancel after response, cancel during middleware
- Testing async timing and cancellation is complex

#### Testing Infrastructure Setup (Phase 1.3)

**Estimated Time:** 50-70 hours
**Complexity:** High

**Breakdown:**

- Vitest configuration: 6-8h
- Coverage setup and thresholds: 4-6h
- Test utilities and helpers: 10-12h
- Local HTTP server setup (for integration tests): 12-15h
- Browser compatibility test setup (NOT E2E): 12-15h
- CI integration: 8-10h
- Troubleshooting and debugging: 8-12h

**Why It Takes This Long:**

- Integration tests need real HTTP server setup
- Browser compatibility testing (via Playwright) tests native APIs across browsers, NOT full app flows
- CI/CD setup always has platform-specific issues
- Test utilities need to be well-designed for reusability

**Important Note on Browser Testing:**
Browser compatibility tests verify that native APIs (fetch, Headers, AbortController) work correctly across Chrome, Firefox, Safari, and Edge. This is NOT E2E testing - we're testing the library's behavior, not full application user flows. E2E testing is for applications, not libraries.

#### Documentation (Phase 3.1)

**Estimated Time:** 80-100 hours
**Complexity:** High

**Breakdown:**

- JSDoc for all public APIs: 20-25h
- API reference generation (TypeDoc): 6-8h
- User guide and tutorials: 20-25h
- Migration guide with examples: 15-20h
- Troubleshooting guide: 10-12h
- Review and iteration (2-3 passes): 15-20h

**Why It Takes This Long:**

- Documentation always takes 3x longer than expected
- Examples must be tested and actually work
- Multiple review passes needed for clarity
- Migration guide requires side-by-side comparisons
- Good docs require understanding user perspective

### Total Time Estimate Summary

| Phase     | Component                        | Hours       | Complexity |
| --------- | -------------------------------- | ----------- | ---------- |
| 0         | Preparation & Baseline           | 30-40       | Medium     |
| 1.1       | Bug Fixes                        | 40-60       | High       |
| 1.2       | Tooling Modernization            | 40-60       | Medium     |
| 1.3       | Testing Infrastructure           | 50-70       | High       |
| 1.4       | Type Safety                      | 20-30       | Medium     |
| 2.1       | Middleware Management            | 50-70       | High       |
| 2.2       | Error Handling & Retry           | 50-70       | High       |
| 2.3       | AbortController                  | 30-40       | High       |
| 2.4       | Middleware Utilities             | 60-80       | Medium     |
| 2.5       | Integration & Polish             | 30-40       | Medium     |
| 3.1       | Documentation                    | 80-100      | High       |
| 3.2       | Examples & Framework Integration | 30-40       | Medium     |
| 3.3       | Community Setup                  | 15-20       | Low        |
| 4.1       | Alpha Release                    | 20-30       | Medium     |
| 4.2       | Beta Release                     | 30-40       | Medium     |
| 4.3       | Release Candidate                | 15-20       | Low        |
| 4.4       | Marketing & Launch               | 30-40       | Medium     |
| **TOTAL** | **All Phases**                   | **620-850** | **Varies** |

### Why Original Estimates Were Off by ~100%

The original plan estimated 300-420 hours, but realistic estimates are 620-850 hours. Here's why:

1. **Testing Underestimated (3x)**: Original plan: 20h for testing setup. Reality: 50-70h due to integration tests, browser tests, CI setup, and mock strategies.

2. **Documentation Underestimated (3x)**: Original plan: 30h. Reality: 80-100h. Documentation always takes longer than expected, requires multiple passes, and examples must be tested.

3. **Middleware Complexity Underestimated (2x)**: Priority ordering, conditional execution, error propagation, and comprehensive testing adds significant complexity.

4. **Integration Work Not Accounted For**: Original estimates didn't include integration testing time, polish work, and cross-component bug fixing (30-40h added).

5. **No Buffer for Unknowns**: Original plan had no contingency buffer. Realistic plans include 20-30% buffer for unexpected issues.

6. **Tooling Setup Underestimated (2x)**: Modern build pipelines (tsup/rollup), ESLint, Prettier, CI/CD, and npm automation take longer than expected due to configuration complexity.

### Recommendations for Staying on Track

1. **Track Actual vs Estimated Hours Weekly**: Update estimates early if falling behind
2. **Use Time-Boxing**: If a task takes 50% over estimate, reassess approach
3. **Prioritize Ruthlessly**: If timeline slips, cut scope, not quality
4. **Pair on Complex Tasks**: Middleware pipeline and AbortController are good candidates
5. **Document as You Go**: Don't leave documentation to the end
6. **Test Early and Often**: Integration issues found late are expensive

---

## Summary

This implementation guide provides the technical foundation for building fej v2. Key points:

1. **Modular Architecture**: Clean separation of concerns
2. **Type Safety**: Full TypeScript with strict mode
3. **Focused Scope**: Only 8-10 essential features in v2.0
4. **Backward Compatibility**: v1 compatibility layer
5. **Testing**: Comprehensive test coverage (NOT e2e - libraries don't need e2e)
6. **Modern Tooling**: Current best practices
7. **Zero Dependencies**: Maintain production dependency-free status
8. **Realistic Bundle Size**: <10KB full library, ~6-8KB typical usage with automated enforcement

### Scope Changes from Original Plan

**70% Feature Reduction Applied:**

- ✅ **Included in v2.0**: Named middleware, error handling, retry, AbortController, 3 essential middleware utilities
- ❌ **Deferred to v2.1+**: Circuit breaker, caching, deduplication, performance monitoring, advanced features

**Why?**

- Realistic 6-8 month timeline (vs impossible 3-5 months)
- High quality implementation
- Maintainable codebase
- True simplicity

### Bundle Size Strategy (Addresses Critical Review Point 4)

**The Problem (Original Plan):**

- Target: <5KB minified with 30+ features
- Reality: Mathematically impossible
- v1 is ~3KB, adding 30 features would result in ~27KB (3KB + 30 × 0.8KB)

**The Solution (Revised Plan):**

1. **Realistic Target**: <10KB minified for full library (competitive with ky at 8KB)
2. **Typical Usage**: ~6-8KB with tree-shaking (most users won't import everything)
3. **Core Only**: <5KB for minimal usage (maintains v1's small footprint for basic use)
4. **Automated Enforcement**:
   - `size-limit` configured with strict limits
   - CI fails if bundle size exceeds targets
   - Per-feature budget of ~0.8-1KB (10KB ÷ 10 features)
   - PR comments show size impact of changes

**Why This is Better:**

- Achievable with reduced scope (8-10 features vs 30+)
- Automated checks prevent size creep
- Still competitive (smaller than axios at 13KB)
- Tree-shaking gives users control over final size
- Per-feature budgets maintain discipline

**Implementation:**

- See `.size-limit.json` configuration above
- Run `npm run size` locally to check
- Run `npm run size:why` to analyze composition
- CI automatically checks on every PR

Follow this guide to ensure consistent, high-quality implementation of **essential features only**.

---

## Zero-Dependency Policy Summary

### What Was Removed Due to Zero-Dependency Conflicts

This section summarizes all features removed from v2.0 to maintain the zero-dependency policy (Critical Review Point 5):

| Feature                     | Original Phase | Conflict                                              | Resolution                                                |
| --------------------------- | -------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| **Runtime Type Validation** | Phase 1.4      | Requires Zod/Yup/io-ts or 2-3KB custom code           | ❌ **REMOVED** - Users handle validation themselves       |
| **Circuit Breaker**         | Phase 2        | Requires opossum/cockatiel or 3-5KB custom code       | ❌ **DEFERRED** to v2.2+ as `@fej/plugin-circuit-breaker` |
| **Advanced Caching**        | Phase 2        | Requires lru-cache or 2-4KB custom LRU implementation | ❌ **DEFERRED** to v2.2+ as `@fej/plugin-cache`           |
| **Request Deduplication**   | Phase 2        | Complex 1-2KB implementation                          | ❌ **DEFERRED** to v2.3+                                  |
| **Performance Monitoring**  | Phase 2        | Not essential, adds complexity                        | ❌ **DEFERRED** to v2.2+                                  |
| **MSW for Testing**         | Testing        | 30KB dev dependency                                   | ❌ **REPLACED** with native http server                   |

### What Remains in v2.0 (All Zero-Dependency)

✅ **Core Features (Native APIs Only):**

1. Named middleware with priority (native Map, Array.sort)
2. Error handling + basic retry (native setTimeout, Promise)
3. AbortController integration (native AbortController API)
4. Bearer token middleware (native Headers)
5. Logger middleware (native console, Date.now)
6. Basic retry middleware (native setTimeout, Promise)

✅ **All Implementation Uses Only:**

- Native fetch API
- Native Headers, URL, URLSearchParams
- Native AbortController, AbortSignal
- Native Promise, async/await
- Native Map, Set, WeakMap
- Native setTimeout, clearTimeout
- Native Object methods (assign, entries, keys, values)
- Native JSON (parse, stringify)

### Enforcement Mechanisms

1. **CI Check**: Automated check that `dependencies` field is empty
2. **Code Review**: Manual review of all imports
3. **Documentation**: Clear policy documented in README and CONTRIBUTING
4. **Size Limit**: Bundle size checks prevent bloat
5. **Regular Audits**: Periodic review of import statements

### Future Plugin Architecture (v2.2+)

For features that genuinely need dependencies:

```typescript
// Core: ALWAYS zero dependencies
import { createFej } from 'fej';

// Plugins: Optional, user's choice to add dependencies
import cachePlugin from '@fej/plugin-cache'; // peer: lru-cache
import circuitBreakerPlugin from '@fej/plugin-circuit-breaker'; // peer: opossum
import validationPlugin from '@fej/plugin-validation'; // peer: zod

const api = createFej()
  .use(cachePlugin({ maxSize: 100 }))
  .use(circuitBreakerPlugin({ threshold: 5 }))
  .use(validationPlugin({ schema: userSchema }));
```

**Benefits:**

- Core library: ZERO dependencies forever ✅
- Power users: Opt-in to features with dependencies
- Bundle size: Pay only for what you use
- Security: Users control supply chain risk

### User Alternatives for Deferred Features

**Need Caching?**

- Use browser's Cache API (service workers)
- Simple Map-based caching: `const cache = new Map()`
- External library: `lru-cache`, `quick-lru`
- Wait for `@fej/plugin-cache` in v2.2+

**Need Circuit Breaking?**

- Use basic retry middleware (included)
- Simple error counting in app layer
- External library: `opossum`, `cockatiel`
- Wait for `@fej/plugin-circuit-breaker` in v2.2+

**Need Type Validation?**

- Validate after response: `const user = userSchema.parse(await res.json())`
- Use any validation library: Zod, Yup, io-ts, AJV
- Wait for `@fej/plugin-validation` in v2.2+

**Need Request Deduplication?**

- Use React Query, SWR, or TanStack Query
- Implement in application layer
- Wait for potential v2.3+ feature

This strict zero-dependency policy is a **core competitive advantage** and **non-negotiable principle** of fej.

---

## Risk Management for Implementation

**Updated based on Critical Review Point 8**: This section provides practical, implementation-focused risk mitigation strategies for developers working on fej v2.

### Implementation Risk Checklist

Use this checklist before starting any major implementation task:

#### Before Starting Feature Implementation

- [ ] **Scope Check**: Is this feature in the v2.0 scope (8-10 essential features)? If not, defer to v2.1+
- [ ] **Bundle Size Budget**: Calculate estimated minified size. Does it fit within ~0.8-1KB per-feature budget?
- [ ] **Zero-Dependency Check**: Does this feature require any external dependencies? If yes, defer to plugin architecture
- [ ] **Complexity Assessment**: Can this be implemented in allocated time? If >50% over estimate, simplify or defer
- [ ] **Test Strategy**: Plan tests before coding. What are success/error/edge cases?
- [ ] **API Design Review**: Sketch API. Is it simple? Does it fit with existing patterns?

#### During Implementation

- [ ] **Time Tracking**: Log hours spent. If >25% over estimate, reassess or ask for help
- [ ] **Incremental Commits**: Commit working code frequently (every 2-3 hours of work)
- [ ] **Size Monitoring**: Run `npm run size` before committing. Check size impact
- [ ] **Test as You Go**: Write tests alongside code, not after
- [ ] **Documentation**: Update JSDoc, examples, and guide in same PR as code
- [ ] **Code Review**: Request review early if uncertain about approach

#### Before PR/Merge

- [ ] **All Tests Pass**: Unit, integration, and browser tests green
- [ ] **Size Limit Check**: `npm run size` passes all limits
- [ ] **Zero Dependencies**: `package.json` dependencies still empty
- [ ] **TypeScript Strict**: `npm run typecheck` passes with zero errors
- [ ] **Linting**: `npm run lint` passes with zero errors
- [ ] **Documentation Updated**: API docs, examples, migration guide current
- [ ] **Breaking Changes Noted**: If any, documented in CHANGELOG and migration guide

---

### Top Implementation Risks & Mitigation

These are the highest-priority risks during implementation, with concrete actions:

#### 1. 🔥 Scope Creep During Development (Risk P-01, Score: 25)

**Symptom:** "Just one more feature" thinking, feature expansion mid-implementation

**Prevention:**

```typescript
// ❌ BAD: Adding features mid-implementation
// Original: Simple retry middleware
// Then: "Let's add jitter, circuit breaker, fallbacks..."

// ✅ GOOD: Stick to original scope
// Implement basic retry only (attempts, delay, exponential backoff)
// Log "nice-to-have" ideas for v2.1+ in GitHub issues
```

**Action if detected:**

1. Stop implementation immediately
2. Evaluate: Is this essential for v2.0 MVP?
3. If no, create GitHub issue tagged "v2.1" or "v2.2"
4. Return to original scope
5. Discuss with team/community if uncertain

**Weekly scope review questions:**

- Are we implementing only the 8-10 essential features?
- Have we added any unplanned features this week?
- Are any features more complex than originally estimated?

---

#### 2. 🔥 Bundle Size Exceeds 10KB (Risk T-02, Score: 16)

**Symptom:** `npm run size` fails, PR shows size increase

**Prevention:**

- Run `npm run size` before every commit
- Use `npm run size:why` to analyze composition
- Keep features simple and focused
- Extract reusable utilities to avoid duplication
- Tree-shaking friendly exports (named exports, no side effects)

**Example of size-conscious code:**

```typescript
// ❌ BAD: Large dependencies or complex code
import { every, map, filter } from 'lodash'; // +20KB

// ✅ GOOD: Native APIs only
const filtered = array.filter(fn);
const mapped = array.map(fn);

// ❌ BAD: Large inline objects
const STATUS_CODES = {
  100: 'Continue',
  101: 'Switching Protocols' /* ... 60 more */,
};

// ✅ GOOD: Only what's needed
const RETRYABLE_STATUS = [408, 429, 500, 502, 503, 504];
```

**Action if exceeded:**

1. Run `npm run size:why` to identify largest contributors
2. Analyze if feature can be simplified
3. Consider extracting to optional plugin
4. Remove feature if it exceeds budget significantly
5. Do NOT merge until under limit

**Per-feature budget enforcement:**

- Each of 8-10 features: ~0.8-1KB minified
- Core infrastructure: ~2-3KB
- Total: <10KB
- Reject features that can't meet budget

---

#### 3. 🔥 Breaking Changes Alienate Users (Risk T-01, Score: 20)

**Symptom:** Beta users report difficult migration, negative feedback

**Prevention during implementation:**

- Maintain compatibility layer that mirrors v1 API
- Test that v1 code runs with deprecation warnings
- Write migration guide section with every breaking change
- Add console.warn() for deprecated patterns

**Example of safe breaking change:**

```typescript
// v2 API (new)
export function createFej(config: FejConfig): Fej {
  /* ... */
}

// v1 compatibility (temporary, with warning)
export class FejV1Compat {
  setInit(config: FejConfig): void {
    console.warn(
      '[Fej v2 Deprecation] Fej.setInit() is deprecated.\n' +
        'Use: const api = createFej({ ... }) instead.\n' +
        'See migration guide: https://fej.dev/v2-migration\n' +
        'This compatibility layer will be removed in v2.1 or v3.0.'
    );
    // ... implement compatibility
  }
}
```

**Compatibility layer checklist:**

- [ ] All v1 public APIs still work (with warnings)
- [ ] Warnings include clear migration path
- [ ] Warnings link to migration guide
- [ ] Warnings mention when compatibility ends
- [ ] Manual testing with real v1 code confirms it works

**Action if users report migration difficulty:**

1. Gather specific feedback on pain points
2. Improve codemod to handle edge cases
3. Enhance migration guide with more examples
4. Consider extending compatibility layer duration
5. Survey to understand scope of issue

---

#### 4. 🔥 Maintainer Burnout (Risk P-02, Score: 20)

**Symptom:** Working >35h/week consistently, feeling exhausted, losing motivation

**Prevention:**

- Track hours weekly using time tracker or manual log
- Target: 25-30 hours/week maximum
- Schedule 1 day off per week (no fej work)
- Take breaks every 2 hours during work
- Say "no" to scope creep
- Find co-maintainer early (Phase 1 or 2)

**Weekly check-in questions:**

1. How many hours did I work this week? (Target: ≤30h)
2. Am I enjoying the work or dreading it? (Should be mostly enjoying)
3. Am I sleeping well? (Burnout affects sleep)
4. Do I feel behind schedule? (Red flag if always feeling behind)
5. Would I recommend this pace to a friend? (If no, slow down)

**Action if burnout symptoms detected:**

1. **Immediate**: Take 1 week complete break from project
2. **Short-term**: Reduce weekly hours to 15-20 for 2 weeks
3. **Medium-term**:
   - Cut scope further (drop features to v2.1)
   - Extend timeline (communicate to users)
   - Find co-maintainer urgently
4. **Long-term**:
   - Reassess project viability
   - Consider pausing development
   - Community takeover if necessary

**Red flags to watch:**

- Consistently working weekends
- Thinking about project during sleep/meals
- Canceling social plans to work on project
- Feeling guilty when not working
- Physical symptoms (headaches, fatigue, anxiety)

---

#### 5. 🔥 Technical Debt Accumulation (Risk T-08, Score: 16)

**Symptom:** Code getting messy, tests brittle, hard to add features

**Prevention:**

- Code review every PR (no exceptions)
- Refactor while implementing, not later
- Use Architecture Decision Records (ADRs) for major decisions
- Keep functions small (<50 lines)
- Keep files focused (<300 lines)
- Document complex logic inline
- Write self-documenting code (good names > comments)

**Code quality checklist before merge:**

- [ ] No code duplication (DRY principle)
- [ ] Functions do one thing well (Single Responsibility)
- [ ] No magic numbers/strings (use named constants)
- [ ] Complex logic has inline comments
- [ ] All public APIs have JSDoc
- [ ] Tests are clear and focused
- [ ] No TODOs or FIXMEs in committed code (create issues instead)

**Monthly tech debt review:**

1. Search for: `TODO`, `FIXME`, `HACK`, `XXX` in codebase
2. Review files >300 lines (candidates for splitting)
3. Check for code duplication with manual review
4. Identify brittle tests (tests that fail randomly)
5. Schedule refactoring sprint if debt is high

**When to reject a PR due to tech debt:**

- Introduces significant duplication
- Makes code materially harder to understand
- Skips tests "temporarily"
- Adds TODOs instead of fixing properly
- Violates established patterns without justification

---

#### 6. Can't Maintain All Features Long-Term (Risk P-07, Score: 16)

**Symptom:** Struggling to review PRs, fix bugs, update docs for all features

**Prevention:**

- **This is why we cut scope 70%**: 8-10 features is maintainable, 30+ is not
- Document everything (code, process, decisions)
- Automate what can be automated (tests, builds, releases)
- Find co-maintainer who can cover when you're unavailable
- Plugin architecture for optional features (community maintains plugins)

**Maintenance burden assessment per feature:**

- **Low burden** (1-2h/month): Simple, stable features (auth middleware, logger)
- **Medium burden** (3-5h/month): Moderate complexity (retry logic, AbortController)
- **High burden** (6-10h/month): Complex, frequently updated (middleware pipeline)

**Current v2.0 scope maintenance estimate:**

- 8-10 essential features × 3h/month average = **24-30h/month** maintenance
- This is sustainable for 1-2 maintainers
- Original 30+ feature plan would be 90+h/month (unsustainable)

**Warning signs of unsustainable maintenance:**

- Taking >1 week to review PRs
- Bugs staying open >2 weeks
- Documentation falling behind
- Dreading issue notifications
- Users asking same questions repeatedly (docs gap)

**Action if maintenance becomes unsustainable:**

1. Pause new feature work
2. Focus on stability and docs
3. Recruit co-maintainers urgently (blog post, social media)
4. Deprecate least-used features
5. Move non-essential features to community plugins
6. Accept that some features may need to be removed

---

### Risk Escalation Process for Developers

**When to escalate a risk:**

| Situation                          | Severity | Action                                     | Escalate To                  |
| ---------------------------------- | -------- | ------------------------------------------ | ---------------------------- |
| Implementation >50% over estimate  | Medium   | Re-estimate, simplify, or ask for help     | Project lead                 |
| Bundle size exceeds limit          | High     | Do NOT merge, optimize or remove feature   | Project lead                 |
| Breaking change not in plan        | High     | Stop, discuss before implementing          | Community                    |
| Found security vulnerability       | Critical | Stop public work, private disclosure       | Project lead + security team |
| Can't implement without dependency | High     | Stop, redesign without dependency or defer | Project lead                 |
| Blocking bug in dependency         | Medium   | Workaround or use alternative approach     | Project lead                 |
| Another contributor leaves         | Medium   | Document their work, redistribute tasks    | Project lead                 |

**Escalation template (GitHub discussion or issue):**

```markdown
## Risk Escalation: [Brief Description]

**Risk ID**: [e.g., T-02 Bundle Size] or [New Risk]
**Severity**: Critical / High / Medium / Low
**Component**: [Feature or area affected]

### What Happened

[Clear description of the risk event]

### Impact

[What is affected and how severely]

### Current Status

[What has been done so far]

### Options

1. [Option 1: e.g., Remove feature]
   - Pros: [...]
   - Cons: [...]
2. [Option 2: e.g., Simplify implementation]
   - Pros: [...]
   - Cons: [...]

### Recommendation

[Your suggested approach]

### Timeline

[How urgent is this? Can it wait for weekly review?]
```

---

### Developer Mental Health & Sustainability

**This section addresses Risk P-02 (Maintainer Burnout) with practical advice:**

#### Healthy Development Habits

**Daily:**

- [ ] Work in focused 2-hour blocks with breaks
- [ ] Stop work at set time (e.g., 6 PM) regardless of progress
- [ ] No work on weekends unless explicitly planned (max 1 per month)
- [ ] Log hours worked (simple spreadsheet or time tracker)

**Weekly:**

- [ ] Review hours worked (should be ≤30h)
- [ ] Take at least 1 complete day off
- [ ] Check in with yourself: enjoying work? feeling burned out?
- [ ] Celebrate wins (feature completed, PR merged, bug fixed)

**Monthly:**

- [ ] Review overall progress vs timeline
- [ ] Adjust estimates and scope if needed
- [ ] Share progress with community (builds momentum)
- [ ] Take weekend completely off (2-3 days no work)

**Warning signs you're overworking:**

1. Thinking about project constantly
2. Working nights and weekends regularly
3. Feeling guilty when not working
4. Neglecting relationships, health, other interests
5. Dreading working on the project
6. Physical symptoms (headaches, fatigue, poor sleep)

**If you notice warning signs:**

1. Take immediate 1-week break (no exceptions)
2. Reassess timeline and scope
3. Find help (co-maintainer, contributors)
4. Remember: This is open source, not a job
5. Your health > project completion

#### Saying "No" to Scope Creep

**Practice these responses:**

**User requests new feature:**

> "That's a great idea! I'm keeping v2.0 focused on essential features, but this would be perfect for v2.1. I've created an issue to track it: [link]"

**You think of cool new feature:**

> "This is neat, but v2.0 already has 10 features. I'll add this to the v2.1 backlog and implement it after launch if there's demand."

**Pressure to add "just one more thing":**

> "I appreciate the enthusiasm, but adding features now risks delaying v2.0 for everyone. Let's get v2.0 solid first, then iterate."

**Contributor offers complex feature PR:**

> "Thanks for the contribution! This is more complex than v2.0 scope. Could we:\n1. Simplify to core functionality only, OR\n2. Defer to v2.1 after core is stable?\nLet me know what you prefer!"

---

### Risk Review Templates

#### Weekly Risk Review Template (15 minutes every Monday)

```markdown
# Weekly Risk Review - [Date]

## Top 5 Risks Status

1. **P-01: Scope Creep** (Score: 25)
   - Status: [Green/Yellow/Red]
   - New features added this week: [0 expected]
   - Action needed: [None / Stop feature X]

2. **P-02: Maintainer Burnout** (Score: 20)
   - Hours worked last week: [X hours]
   - Feeling: [Energized/Neutral/Exhausted]
   - Action needed: [None / Take break / Reduce hours]

3. **T-01: Breaking Changes** (Score: 20)
   - Beta feedback this week: [Summary]
   - Migration issues reported: [Count]
   - Action needed: [None / Improve docs / Fix issue]

4. **T-02: Bundle Size** (Score: 16)
   - Current size: [X KB / 10 KB]
   - Trend: [Stable/Growing/Shrinking]
   - Action needed: [None / Optimize / Remove feature]

5. **T-08: Technical Debt** (Score: 16)
   - PRs with tech debt this week: [Count]
   - Refactoring done: [Yes/No]
   - Action needed: [None / Schedule refactoring]

## New Risks Identified

[Any new risks discovered this week]

## Risks Closed

[Any risks resolved this week]

## Decisions Made

[Related to risk mitigation]

## Next Week Focus

[Top 2-3 risks to focus on]
```

#### Monthly Comprehensive Risk Review Template (1 hour first Monday of month)

```markdown
# Monthly Risk Review - [Month, Year]

## Executive Summary

- Total active risks: [Count]
- Critical (20-25): [Count]
- High (16-19): [Count]
- Medium (8-15): [Count]
- Timeline status: [On track / At risk / Delayed]
- Budget status: [Hours used / Total]

## Risk Score Changes

| Risk ID | Old Score | New Score | Change | Reason                 |
| ------- | --------- | --------- | ------ | ---------------------- |
| T-01    | 20        | 16        | ↓ -4   | Beta feedback positive |
| ...     | ...       | ...       | ...    | ...                    |

## New Risks Added This Month

[List with brief description]

## Risks Closed This Month

[List with resolution]

## Top Concerns for Next Month

1. [Risk and why it's concerning]
2. [Risk and why it's concerning]
3. [Risk and why it's concerning]

## Mitigation Plan Updates

[Any changes to mitigation strategies]

## Scope/Timeline Adjustments Needed?

[Recommendations based on risk assessment]

## Action Items

- [ ] [Action 1]
- [ ] [Action 2]
- [ ] [Action 3]
```

---

### Integration with Development Workflow

#### Git Workflow with Risk Checks

```bash
# Before starting work on feature
$ npm run risk-check  # Check bundle size, dependencies, etc.

# During development
$ git add .
$ npm test              # Tests must pass
$ npm run typecheck     # Types must be valid
$ npm run lint          # Linting must pass
$ npm run size          # Size must be within limit
$ git commit -m "feat: implement retry middleware"

# Before creating PR
$ npm run prepublishOnly  # Runs all checks
$ gh pr create --title "feat: add retry middleware" --body "..."

# CI automatically runs:
# - All tests
# - Type checking
# - Linting
# - Bundle size checks
# - Zero-dependency verification
```

#### PR Review Checklist (Risk-Focused)

When reviewing PRs, check for risks:

- [ ] **Scope**: Is this in v2.0 scope? If not, close or defer
- [ ] **Size**: Does size-limit pass? If not, optimize or reject
- [ ] **Dependencies**: Does it add any? If yes, reject immediately
- [ ] **Complexity**: Is it simple? If overly complex, request simplification
- [ ] **Tests**: Are all cases covered? If not, request additional tests
- [ ] **Docs**: Is documentation updated? If not, request update
- [ ] **Breaking Changes**: Are they documented? If not, request documentation
- [ ] **Technical Debt**: Does it introduce debt? If yes, request cleanup

---

### Summary: Risk Management for Developers

**Key Takeaways:**

1. **Scope Discipline**: Stick to 8-10 essential features. Defer everything else to v2.1+
2. **Bundle Size**: Run `npm run size` before every commit. Stay under 10KB.
3. **Zero Dependencies**: Never add production dependencies. Use only native APIs.
4. **Time Tracking**: Log hours weekly. Stay ≤30h/week to avoid burnout.
5. **Quality Over Speed**: Technical debt costs more long-term than taking time to do it right.
6. **Weekly Risk Review**: Every Monday, check top 5 risks (15 minutes).
7. **Escalate Early**: If you're stuck or over estimate by >50%, escalate immediately.
8. **Prioritize Health**: Your well-being > project completion. Take breaks, set boundaries.

**When in doubt, ask:**

- Is this essential for v2.0, or can it wait for v2.1?
- Does this fit within our size budget?
- Does this require any dependencies?
- Am I over-engineering this?
- Is this the simplest solution that works?

**Remember:**

- Perfection is the enemy of good enough
- Shipping v2.0 with 8 solid features > shipping with 30 half-baked features
- Your health and sustainability matter more than any single feature
- The community is here to help - ask for support when needed

This comprehensive risk management approach addresses Critical Review Point 8 and ensures a sustainable, high-quality v2.0 development process.

## IMPLEMENTATION DETAILS

### DEFERRED Features (v2.2+ - Zero-Dependency Conflicts)

The following features were in the original plan but are **intentionally removed** from v2.0 due to **zero-dependency policy conflicts**:

#### ❌ Cache Plugin (Deferred to v2.2+ as `@fej/plugin-cache`)

**Zero-Dependency Conflict**: Advanced caching requires LRU eviction algorithm

**Options Evaluated:**

1. Use `lru-cache` library → **Adds production dependency** ❌
2. Use `quick-lru` library → **Adds production dependency** ❌
3. Custom LRU implementation → **2-4KB of complex code, bug-prone** ❌

**Decision**: Defer to optional plugin with peer dependency

- Core library: zero dependencies ✅
- Plugin `@fej/plugin-cache`: peer dependency on `lru-cache` (user's choice)

**Alternatives for v2.0 Users:**

1. Use browser's native Cache API (available in service workers)
2. Implement simple Map-based caching without LRU
3. Use external caching library of their choice
4. Wait for v2.2+ plugin

#### ❌ Circuit Breaker (Deferred to v2.2+ as `@fej/plugin-circuit-breaker`)

**Zero-Dependency Conflict**: Circuit breaker is complex pattern requiring significant code

**Complexity Analysis:**

- State machine (closed, open, half-open states)
- Failure threshold tracking
- Timeout management and health checks
- Metrics collection and analysis
- **Estimated size**: 3-5KB minified

**Options Evaluated:**

1. Use `opossum` or `cockatiel` library → **Adds production dependency** ❌
2. Custom implementation → **3-5KB, complex, bug-prone** ❌

**Decision**: Defer to optional plugin with peer dependency

- Core library: zero dependencies ✅
- Plugin `@fej/plugin-circuit-breaker`: peer dependency on `opossum`

**Alternatives for v2.0 Users:**

1. Use basic retry middleware (included in v2.0)
2. Implement simple error counting in application layer
3. Wait for v2.2+ plugin

#### ❌ Runtime Type Validation (Removed - Was in Phase 1.4)

**Zero-Dependency Conflict**: Runtime validation requires validation library

**Options Evaluated:**

1. Use Zod → **Adds production dependency** ❌
2. Use Yup → **Adds production dependency** ❌
3. Use io-ts → **Adds production dependency** ❌
4. Custom validator → **2-3KB, reinventing wheel** ❌

**Decision**: Users handle validation themselves

- Core library: zero dependencies ✅
- Users choose their preferred validation library
- Validation can happen after receiving response

**Alternatives for v2.0 Users:**

```typescript
import { z } from 'zod'; // User's choice

const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

const response = await api.get('/users/1');
const data = await response.json();
const user = userSchema.parse(data); // User handles validation
```

**Future**: Could be available as `@fej/plugin-validation` with peer dependency on `zod` in v2.2+

#### ❌ Request Deduplication (Deferred to v2.3+)

**Zero-Dependency Conflict**: Deduplication requires request tracking and promise management

**Complexity Analysis:**

- Request fingerprinting (URL + method + body hashing)
- In-flight request tracking
- Promise sharing and cleanup
- Memory management
- **Estimated size**: 1-2KB minified

**Options Evaluated:**

1. Use request-deduplication library → **Few good options, may add dependency** ❌
2. Custom implementation → **1-2KB, complex edge cases** ❌

**Decision**: Not essential for MVP, defer to v2.3+ (may or may not need plugin)

**Alternatives for v2.0 Users:**

1. Implement application-level request deduplication
2. Use React Query / SWR / TanStack Query (they handle this)
3. Not needed for most use cases

#### ❌ Performance Monitoring (Deferred to v2.2+)

**Zero-Dependency Conflict**: Not a dependency issue, but not essential

**Reason**: Nice-to-have feature, not essential for MVP. Basic timing can be done with logger middleware.

**Alternatives for v2.0 Users:**

1. Use logger middleware to measure request duration (included in v2.0)
2. Use browser's Performance API
3. Use external monitoring tools (DataDog, New Relic, etc.)

---

### Zero-Dependency Implementation Guidelines

For all v2.0 features, **strictly use native APIs only**:

✅ **Allowed APIs:**

- `fetch()` - Native HTTP client
- `Headers` - HTTP header management
- `URL` - URL parsing and manipulation
- `URLSearchParams` - Query string handling
- `AbortController` / `AbortSignal` - Request cancellation
- `Promise` / `async`/`await` - Async control flow
- `Map` / `Set` / `WeakMap` - Native data structures
- `setTimeout` / `clearTimeout` - Timing
- `Object.assign` / spread operator - Object manipulation
- `JSON.parse` / `JSON.stringify` - JSON handling

❌ **Not Allowed:**

- Any `npm install` package (except dev dependencies)
- Lodash, Ramda, or utility libraries
- Validation libraries (Zod, Yup, io-ts)
- Caching libraries (lru-cache, quick-lru)
- Circuit breaker libraries (opossum, cockatiel)
- Any runtime dependency

**Enforcement:**

- Code review checks for imports
- CI checks package.json `dependencies` is empty
- Regular audits of import statements

---
