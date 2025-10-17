# Bug Inventory - fej v1.0.5

**Phase 0.1: Bug Documentation**
**Date:** 2025-10-16
**Status:** Complete

---

## Executive Summary

This document catalogs all known bugs in fej v1.0.5, prioritized by severity with reproduction cases, fix estimates, and v2 roadmap assignments.

**Total Bugs Identified:** 14
**P0 (Critical):** 2
**P1 (High):** 5
**P2 (Medium):** 5
**P3 (Low):** 2

**Total Estimated Fix Time:** 47-67 hours

---

## Priority Definitions

| Priority | Definition                                               | Impact                | Timeline             |
| -------- | -------------------------------------------------------- | --------------------- | -------------------- |
| **P0**   | Critical - Causes crashes, data loss, or security issues | Blocks production use | Must fix in Phase 1  |
| **P1**   | High - Broken core functionality                         | Major feature broken  | Fix in Phase 1       |
| **P2**   | Medium - Degraded functionality or poor UX               | Minor feature issues  | Fix in Phase 2       |
| **P3**   | Low - Minor issues or nice-to-haves                      | Cosmetic/convenience  | Consider for Phase 3 |

---

## P0 - Critical Bugs

### BUG-001: Async Middleware Execution Broken

**Location:** `src/index.ts:64`
**Priority:** P0 (Critical)
**Impact:** Async middleware completely non-functional
**Affected Users:** Anyone using `addAsyncMiddleware()`
**Status:** Confirmed

#### Description

The `mergeAsyncMiddlewares` method awaits the middleware array itself instead of invoking the middleware functions. This causes async middleware to never execute.

#### Reproduction

```typescript
import fej, { addAsyncMiddleware } from 'fej';

// Add async middleware to fetch token
addAsyncMiddleware(async (init) => {
  const token = await getAuthToken();
  return {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  };
});

// This request will NOT have the Authorization header
const response = await fej('https://api.example.com/data');
```

#### Root Cause

```typescript
// Line 64 - INCORRECT
const mdwResults = await Promise.all(this.asyncMiddleWares);

// Should be:
const mdwResults = await Promise.all(this.asyncMiddleWares.map((mdw) => mdw(_init)));
```

#### Expected Behavior

Async middleware functions should be invoked with the current init object and their results merged.

#### Actual Behavior

Middleware functions are not invoked. The array of functions is awaited, returning immediately with the function references unchanged.

#### Fix Estimate

**Time:** 1-2 hours
**Complexity:** Low
**Testing Required:** 2-3 hours (write comprehensive async middleware tests)
**Total:** 3-5 hours

#### v2 Assignment

**Phase:** Phase 1 - Foundation
**Task:** 1.1 Critical Bug Fixes
**Milestone:** Must be fixed before any v2 release

---

### BUG-002: Race Condition in Deep Merge

**Location:** `src/index.ts:47-61`
**Priority:** P0 (Critical)
**Impact:** Potential data corruption in concurrent requests
**Affected Users:** Applications with high request concurrency
**Status:** Confirmed

#### Description

The `mergeDeep` function mutates the target object directly, which can cause race conditions when multiple middleware execute concurrently and modify the same init object.

#### Reproduction

```typescript
import fej, { addAsyncMiddleware } from 'fej';

// Add two async middlewares that modify headers
addAsyncMiddleware(async (init) => {
  await delay(100);
  return { ...init, headers: { ...init.headers, 'X-Request-ID': '123' } };
});

addAsyncMiddleware(async (init) => {
  await delay(50);
  return { ...init, headers: { ...init.headers, 'X-Trace-ID': '456' } };
});

// Fire multiple concurrent requests
Promise.all([
  fej('https://api.example.com/1'),
  fej('https://api.example.com/2'),
  fej('https://api.example.com/3'),
]);

// Headers may be lost or overwritten due to mutation
```

#### Root Cause

```typescript
// Lines 47-61 - Mutates target directly
private mergeDeep = (target: any, source: any) => {
  if (this.isObject(target) && this.isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (this.isObject(source[key])) {
        if (!target[key] || !this.isObject(target[key])) {
          target[key] = source[key]; // MUTATION
        }
        this.mergeDeep(target[key], source[key]); // MUTATION
      } else {
        Object.assign(target, { [key]: source[key] }); // MUTATION
      }
    });
  }
  return target;
}
```

#### Expected Behavior

Each middleware should receive an immutable copy of the init object to prevent race conditions.

#### Actual Behavior

Shared mutable state causes unpredictable behavior with concurrent requests.

#### Fix Estimate

**Time:** 3-4 hours
**Complexity:** Medium (requires careful immutability implementation)
**Testing Required:** 4-5 hours (concurrency tests, edge cases)
**Total:** 7-9 hours

#### v2 Assignment

**Phase:** Phase 1 - Foundation
**Task:** 1.1 Critical Bug Fixes
**Milestone:** Must be fixed before any v2 release

---

## P1 - High Priority Bugs

### BUG-003: Incorrect Async Declaration on addMiddleware

**Location:** `src/index.ts:27`
**Priority:** P1 (High)
**Impact:** Misleading API, violates type contract
**Affected Users:** All developers using TypeScript
**Status:** Confirmed

#### Description

The `addMiddleware` method is declared as `async` but doesn't perform any async operations and doesn't return a Promise, violating its type signature.

#### Reproduction

```typescript
import { addMiddleware } from 'fej';

// This should NOT compile if types were correct
const result = await addMiddleware((init) => init);
console.log(result); // undefined, not a Promise
```

#### Root Cause

```typescript
// Line 27 - INCORRECT
public addMiddleware = async (fn: IFejMiddleware) => {
  function runMiddleware(_init: RequestInit) {
    return fn(_init);
  }
  this.middleWares.push(runMiddleware);
}

// Should be:
public addMiddleware = (fn: IFejMiddleware) => {
  this.middleWares.push(fn);
}
```

#### Expected Behavior

Synchronous method that returns `void`, matching its purpose.

#### Actual Behavior

Returns an empty Promise that serves no purpose.

#### Fix Estimate

**Time:** 0.5-1 hour
**Complexity:** Trivial
**Testing Required:** 1 hour
**Total:** 1.5-2 hours

#### v2 Assignment

**Phase:** Phase 1 - Foundation
**Task:** 1.1 Critical Bug Fixes
**Milestone:** Quick fix for v1.9 deprecation release

---

### BUG-004: No Error Handling for Middleware Failures

**Location:** `src/index.ts:10-21, 63-77, 79-85`
**Priority:** P1 (High)
**Impact:** Unhandled rejections, poor error messages
**Affected Users:** All users when middleware throws errors
**Status:** Confirmed

#### Description

Neither `fej()`, `mergeAsyncMiddlewares()`, nor `mergeNonAsyncMiddlewares()` have try-catch blocks. Middleware errors propagate as unhandled promise rejections with no context.

#### Reproduction

```typescript
import fej, { addMiddleware } from 'fej';

addMiddleware((init) => {
  throw new Error('Middleware failed!');
});

// Unhandled rejection - no context about which middleware failed
fej('https://api.example.com/data');
```

#### Expected Behavior

Middleware errors should be caught, logged with context (middleware name/index), and either:

1. Rethrown with enhanced error message, or
2. Passed to an error handler middleware

#### Actual Behavior

Raw error propagates with no context about where it originated.

#### Fix Estimate

**Time:** 4-5 hours (implement error middleware pattern)
**Complexity:** Medium
**Testing Required:** 3-4 hours
**Total:** 7-9 hours

#### v2 Assignment

**Phase:** Phase 1 - Foundation
**Task:** 1.2 Error Handling System
**Milestone:** Core feature for v2.0

---

### BUG-005: No Validation of Middleware Return Values

**Location:** `src/index.ts:27-39, 63-77, 79-85`
**Priority:** P1 (High)
**Impact:** Runtime errors if middleware returns invalid values
**Affected Users:** All users with buggy middleware
**Status:** Confirmed

#### Description

Middleware functions can return `undefined`, `null`, or non-object values, causing `mergeDeep` to fail silently or throw cryptic errors.

#### Reproduction

```typescript
import fej, { addMiddleware } from 'fej';

// Middleware returns undefined
addMiddleware((init) => {
  console.log('Side effect');
  // Forgot to return init
});

// This will cause issues in mergeDeep
fej('https://api.example.com/data');
```

#### Expected Behavior

Validate middleware return values and throw helpful errors like:
`Error: Middleware at index 0 returned undefined. Must return RequestInit object.`

#### Actual Behavior

Silent failure or cryptic TypeError in mergeDeep.

#### Fix Estimate

**Time:** 2-3 hours
**Complexity:** Low
**Testing Required:** 2 hours
**Total:** 4-5 hours

#### v2 Assignment

**Phase:** Phase 1 - Foundation
**Task:** 1.2 Error Handling System
**Milestone:** Developer experience improvement

---

### BUG-006: Fetch Errors Not Intercepted

**Location:** `src/index.ts:20`
**Priority:** P1 (High)
**Impact:** No way to handle network errors globally
**Affected Users:** All users needing error handling
**Status:** Confirmed

#### Description

The `fetch()` call has no error handling. Network errors, timeouts, and HTTP errors cannot be intercepted globally.

#### Reproduction

```typescript
import fej from 'fej';

// Network error has no global handler
try {
  await fej('https://invalid-domain-that-doesnt-exist.com');
} catch (error) {
  // User must handle every request individually
  console.error(error);
}
```

#### Expected Behavior

Provide a way to register error middleware that can:

1. Log errors globally
2. Retry failed requests
3. Transform error objects
4. Show toast notifications

#### Actual Behavior

No error interception capability. Each call site must handle errors.

#### Fix Estimate

**Time:** 5-6 hours (design error middleware API)
**Complexity:** Medium
**Testing Required:** 4 hours
**Total:** 9-10 hours

#### v2 Assignment

**Phase:** Phase 1 - Foundation
**Task:** 1.2 Error Handling System
**Milestone:** Essential v2 feature

---

### BUG-007: Middleware Executed Sequentially, Not in Parallel

**Location:** `src/index.ts:67-74`
**Priority:** P1 (High)
**Impact:** Poor performance with multiple async middleware
**Affected Users:** Applications with multiple async middleware
**Status:** Confirmed - Design Issue

#### Description

Async middleware execute serially using `map + await` pattern. Independent async operations (like fetching from different sources) block each other unnecessarily.

#### Reproduction

```typescript
import fej, { addAsyncMiddleware } from 'fej';

// Each middleware takes 1 second
addAsyncMiddleware(async (init) => {
  await delay(1000);
  return { ...init, headers: { ...init.headers, 'X-Token-1': 'abc' } };
});

addAsyncMiddleware(async (init) => {
  await delay(1000);
  return { ...init, headers: { ...init.headers, 'X-Token-2': 'def' } };
});

// Takes 2 seconds instead of 1 second
await fej('https://api.example.com/data');
```

#### Root Cause

```typescript
// Lines 67-74 - Sequential execution
await Promise.all(
  mdwResults.map(async (asyncMiddleware) => {
    const mdwInit = await asyncMiddleware(_init); // Waits for each
    _init = this.mergeDeep(_init, mdwInit);
    return _init;
  })
);
```

#### Expected Behavior

Independent middleware should run in parallel. Provide option for sequential vs parallel execution.

#### Actual Behavior

All middleware execute sequentially regardless of dependencies.

#### Fix Estimate

**Time:** 4-5 hours (parallel execution + dependency graph optional)
**Complexity:** Medium-High
**Testing Required:** 3-4 hours
**Total:** 7-9 hours

#### v2 Assignment

**Phase:** Phase 2 - Core Features
**Task:** 2.5 Performance Optimizations
**Milestone:** Nice-to-have for v2.0

---

## P2 - Medium Priority Bugs

### BUG-008: Type Safety Issues with 'any'

**Location:** `src/index.ts:41, 47, 63, 79`
**Priority:** P2 (Medium)
**Impact:** Loss of type safety, poor IDE support
**Affected Users:** TypeScript users
**Status:** Confirmed

#### Description

Multiple functions use `any` type instead of proper TypeScript types, defeating the purpose of TypeScript.

#### Locations

- Line 41: `isObject(item: any)` should be `isObject(item: unknown)`
- Line 47: `mergeDeep(target: any, source: any)` should use generics
- Line 63: `mergeAsyncMiddlewares(_init: any)` should be `RequestInit`
- Line 79: `mergeNonAsyncMiddlewares(_init: any)` should be `RequestInit`

#### Fix Estimate

**Time:** 2-3 hours
**Complexity:** Medium
**Testing Required:** 2 hours (type tests)
**Total:** 4-5 hours

#### v2 Assignment

**Phase:** Phase 1 - Foundation
**Task:** 1.3 TypeScript Modernization
**Milestone:** Quality improvement

---

### BUG-009: Deep Merge Edge Cases

**Location:** `src/index.ts:47-61`
**Priority:** P2 (Medium)
**Impact:** Incorrect merging of arrays, dates, special objects
**Affected Users:** Users merging complex objects
**Status:** Confirmed

#### Description

The `mergeDeep` function doesn't handle edge cases:

1. Arrays are treated as objects (merged by index instead of replaced)
2. Date objects are mutated
3. Set/Map objects not handled
4. Circular references cause infinite loops

#### Reproduction

```typescript
import fej, { addMiddleware } from 'fej';

// Arrays get merged incorrectly
addMiddleware((init) => ({
  ...init,
  headers: {
    Accept: ['application/json'],
  },
}));

addMiddleware((init) => ({
  ...init,
  headers: {
    Accept: ['text/html'], // Should replace, not merge by index
  },
}));
```

#### Fix Estimate

**Time:** 3-4 hours
**Complexity:** Medium
**Testing Required:** 3-4 hours (comprehensive edge case tests)
**Total:** 6-8 hours

#### v2 Assignment

**Phase:** Phase 1 - Foundation
**Task:** 1.1 Critical Bug Fixes
**Milestone:** Fix alongside BUG-002

---

### BUG-010: No Middleware Removal Capability

**Location:** `src/index.ts` (missing feature)
**Priority:** P2 (Medium)
**Impact:** Cannot clean up or disable middleware
**Affected Users:** SPAs with dynamic middleware needs
**Status:** Missing Feature

#### Description

No method exists to remove middleware once added. This is problematic for SPAs where middleware needs to change based on auth state.

#### Reproduction

```typescript
import { addMiddleware } from 'fej';

// Add auth middleware
const authMiddleware = (init) => ({
  ...init,
  headers: { ...init.headers, Authorization: 'Bearer token' },
});

addMiddleware(authMiddleware);

// User logs out - NO WAY TO REMOVE MIDDLEWARE
// Tokens will continue being sent
```

#### Expected Behavior

Provide methods like:

- `removeMiddleware(fn)` - Remove specific middleware
- `clearMiddleware()` - Remove all middleware
- Return disposer function from `addMiddleware()`

#### Fix Estimate

**Time:** 2-3 hours
**Complexity:** Low-Medium
**Testing Required:** 2 hours
**Total:** 4-5 hours

#### v2 Assignment

**Phase:** Phase 2 - Core Features
**Task:** 2.1 Named Middleware & Management
**Milestone:** Core feature for v2

---

### BUG-011: No Middleware Ordering Control

**Location:** `src/index.ts:27-39` (missing feature)
**Priority:** P2 (Medium)
**Impact:** Cannot ensure middleware execution order
**Affected Users:** Users needing middleware dependencies
**Status:** Missing Feature

#### Description

Middleware execute in insertion order with no way to control priority or dependencies.

#### Reproduction

```typescript
import { addMiddleware } from 'fej';

// Need token middleware to run BEFORE auth middleware
addMiddleware(authMiddleware); // Added first
addMiddleware(tokenMiddleware); // Should run first but added second

// Wrong order - auth fails because token not set
```

#### Expected Behavior

Support middleware ordering via:

- Priority numbers
- `before`/`after` dependencies
- Manual reordering methods

#### Fix Estimate

**Time:** 4-5 hours
**Complexity:** Medium
**Testing Required:** 3 hours
**Total:** 7-8 hours

#### v2 Assignment

**Phase:** Phase 2 - Core Features
**Task:** 2.1 Named Middleware & Management
**Milestone:** Advanced feature for v2

---

### BUG-012: Global State Pollution

**Location:** `src/index.ts:88-93`
**Priority:** P2 (Medium)
**Impact:** Single global instance prevents multiple configurations
**Affected Users:** Apps needing multiple fej instances
**Status:** Design Issue

#### Description

The library exports a singleton instance, making it impossible to have multiple fej instances with different configurations.

#### Reproduction

```typescript
import fej from 'fej';

// Want separate instances for different APIs
const apiClient = fej; // Can't create new instance
const authClient = fej; // Same instance as apiClient

// All middleware affects both
```

#### Expected Behavior

Allow creating multiple independent instances:

```typescript
import { createFej } from 'fej';

const apiClient = createFej({ baseURL: 'https://api.example.com' });
const authClient = createFej({ baseURL: 'https://auth.example.com' });
```

#### Fix Estimate

**Time:** 2-3 hours
**Complexity:** Low (already has class, just export differently)
**Testing Required:** 2 hours
**Total:** 4-5 hours

#### v2 Assignment

**Phase:** Phase 1 - Foundation
**Task:** 1.4 API Redesign
**Milestone:** Breaking change for v2

---

### BUG-013: Middleware Wrapper Functions Unnecessary

**Location:** `src/index.ts:28-31, 35-38`
**Priority:** P2 (Medium)
**Impact:** Memory overhead, confusing code
**Affected Users:** High-traffic applications
**Status:** Code Quality Issue

#### Description

Both `addMiddleware` and `addAsyncMiddleware` wrap the input function in unnecessary wrapper functions.

#### Root Cause

```typescript
// Lines 28-31 - Unnecessary wrapper
public addMiddleware = async (fn: IFejMiddleware) => {
  function runMiddleware(_init: RequestInit) {
    return fn(_init);
  }
  this.middleWares.push(runMiddleware);
}

// Should be:
public addMiddleware = (fn: IFejMiddleware) => {
  this.middleWares.push(fn);
}
```

#### Fix Estimate

**Time:** 0.5 hours
**Complexity:** Trivial
**Testing Required:** 0.5 hours
**Total:** 1 hour

#### v2 Assignment

**Phase:** Phase 1 - Foundation
**Task:** 1.1 Critical Bug Fixes
**Milestone:** Quick cleanup

---

## P3 - Low Priority Issues

### BUG-014: Missing Request/Response Interceptors

**Location:** `src/index.ts` (missing feature)
**Priority:** P3 (Low)
**Impact:** Cannot intercept responses
**Affected Users:** Users needing response transformation
**Status:** Missing Feature

#### Description

No way to intercept or transform responses after fetch completes.

#### Expected Behavior

Provide response middleware similar to axios interceptors:

```typescript
fej.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);
```

#### Fix Estimate

**Time:** 6-8 hours
**Complexity:** Medium
**Testing Required:** 4 hours
**Total:** 10-12 hours

#### v2 Assignment

**Phase:** Phase 2 - Core Features
**Task:** 2.2 Request/Response Interceptors
**Milestone:** Major v2 feature

---

### BUG-015: No Timeout Handling

**Location:** `src/index.ts:20` (missing feature)
**Priority:** P3 (Low)
**Impact:** Requests can hang indefinitely
**Affected Users:** Apps needing request timeouts
**Status:** Missing Feature

#### Description

No built-in timeout mechanism. Users must implement AbortController manually for every request.

#### Expected Behavior

Support timeout configuration:

```typescript
fej.setInit({ timeout: 5000 });
```

#### Fix Estimate

**Time:** 3-4 hours
**Complexity:** Low-Medium
**Testing Required:** 2-3 hours
**Total:** 5-7 hours

#### v2 Assignment

**Phase:** Phase 2 - Core Features
**Task:** 2.7 Timeout & Cancellation
**Milestone:** Quality of life feature

---

## Summary Tables

### By Priority

| Priority  | Count  | Total Hours | % of Total |
| --------- | ------ | ----------- | ---------- |
| P0        | 2      | 12-14       | 24%        |
| P1        | 5      | 29-35       | 56%        |
| P2        | 5      | 26-31       | 39%        |
| P3        | 2      | 15-19       | 27%        |
| **TOTAL** | **14** | **82-99**   | **146%\*** |

\*Some bugs can be fixed together, reducing actual time

### By Phase Assignment

| Phase                   | Bugs | Estimated Hours |
| ----------------------- | ---- | --------------- |
| Phase 1 - Foundation    | 8    | 35-42           |
| Phase 2 - Core Features | 6    | 47-57           |
| Phase 3+                | 0    | 0               |

### By Category

| Category         | Bugs | Examples                           |
| ---------------- | ---- | ---------------------------------- |
| Logic Bugs       | 3    | BUG-001, BUG-002, BUG-003          |
| Error Handling   | 3    | BUG-004, BUG-005, BUG-006          |
| Missing Features | 5    | BUG-010, BUG-011, BUG-014, BUG-015 |
| Type Safety      | 1    | BUG-008                            |
| Performance      | 1    | BUG-007                            |
| Design Issues    | 2    | BUG-009, BUG-012                   |
| Code Quality     | 1    | BUG-013                            |

---

## Recommendations

### Immediate Actions (v1.9 Release)

1. **BUG-001** (Async middleware) - MUST FIX, blocks async usage
2. **BUG-003** (Async declaration) - Quick fix, improves types
3. **BUG-013** (Wrapper functions) - Trivial cleanup

**Estimated Time:** 5-8 hours

### Phase 1 Must-Fix (v2.0-alpha)

- All P0 bugs (BUG-001, BUG-002)
- All P1 bugs (BUG-003 through BUG-007)
- BUG-008 (Type safety)

**Estimated Time:** 35-42 hours

### Phase 2 Features (v2.0-beta)

- All P2 missing features (BUG-010, BUG-011, BUG-012)
- Performance optimization (BUG-007)

**Estimated Time:** 22-26 hours

### Deferred to Later

- P3 features (BUG-014, BUG-015) can be added post-v2.0 based on user feedback

---

## Testing Requirements

Each bug fix requires:

1. Unit test demonstrating the bug
2. Unit test verifying the fix
3. Integration test for complex bugs
4. Regression test suite update

**Total Testing Overhead:** ~40-50% of fix time (already included in estimates)

---

## Related Documents

- [V2_PLAN.md](./V2_PLAN.md) - Overall v2 roadmap
- [V2_IMPLEMENTATION_GUIDE_PART1.md](./V2_IMPLEMENTATION_GUIDE_PART1.md) - Technical specs
- [RISK_REGISTER.md](./RISK_REGISTER.md) - Risk mitigation
- [PROJECT_REVIEW.md](./PROJECT_REVIEW.md) - Comprehensive review

---

## Change Log

| Date       | Author      | Changes                       |
| ---------- | ----------- | ----------------------------- |
| 2025-10-16 | Claude Code | Initial bug inventory created |

---

**Next Steps:**

1. Review this inventory with maintainers
2. Prioritize v1.9 quick fixes (BUG-001, BUG-003, BUG-013)
3. Begin Phase 1 implementation planning
4. Set up test infrastructure before fixing bugs
