# fej v2.0 is Coming - Prepare Now

**TL;DR**: fej v2.0 brings major improvements including named middleware, better error handling, and modern tooling. v1.9 (with deprecation warnings) is available now. v2.0-alpha launches in ~2 months.

---

## What is fej?

fej is a lightweight, zero-dependency fetch wrapper that adds powerful middleware capabilities to the native Fetch API. It's designed for developers who want the simplicity of fetch with the power of middleware-based request transformation.

**Current stats:**

- 📦 Small bundle size (~3KB minified)
- 🔒 Zero production dependencies
- ✨ Simple middleware API
- 🎯 TypeScript support

---

## Why v2?

After listening to community feedback and analyzing production usage, we identified key areas for improvement:

### Problems in v1

- 🐛 **Critical bugs**: Async middleware execution bug, deep merge edge cases
- 🛠️ **Outdated tooling**: TSLint (deprecated), old TypeScript version
- 📊 **Minimal testing**: <10% code coverage, only 1 basic test
- 🤔 **Confusing API**: Separate `addMiddleware()` vs `addAsyncMiddleware()`
- 🔄 **Limited features**: No error handling, retry, or request cancellation
- 🏗️ **Singleton pattern**: Can't have multiple independent instances

### Goals for v2

1. **Fix all critical bugs** - Zero P0/P1 bugs at launch
2. **Modernize tooling** - TypeScript 5.x strict mode, Vitest, ESLint
3. **Comprehensive testing** - All public APIs tested with edge cases
4. **Better developer experience** - Improved types, error messages, documentation
5. **Essential features** - Named middleware, error handling, retry, cancellation
6. **Maintain simplicity** - Still zero dependencies, small bundle (<10KB)

---

## What's New in v2?

### 1. Named Middleware with Priority

**v1 (Old):**

```javascript
import Fej from 'fej';

Fej.addMiddleware((init) => ({ headers: { 'X-Custom': 'value' } }));
Fej.addAsyncMiddleware(async (init) => {
  const token = await getToken();
  return { headers: { Authorization: `Bearer ${token}` } };
});
```

**v2 (New):**

```javascript
import { createFej } from 'fej';

const api = createFej();

// Named middleware for easy management
api.use(
  'auth',
  async (request, next) => {
    const token = await getToken();
    request.headers.set('Authorization', `Bearer ${token}`);
    await next();
    return request;
  },
  { priority: 100 }
); // High priority = runs first

// Remove middleware by name
api.remove('auth');
```

### 2. Unified Middleware API

No more confusion between sync and async middleware - one unified `use()` method handles both!

### 3. Instance-Based Configuration

**v1 (Old):**

```javascript
Fej.setInit({ headers: { 'Content-Type': 'application/json' } });
```

**v2 (New):**

```javascript
const userApi = createFej({
  baseURL: 'https://api.users.com',
  headers: { 'Content-Type': 'application/json' },
});

const paymentApi = createFej({
  baseURL: 'https://api.payments.com',
  headers: { 'X-API-Key': 'payment-key' },
});

// Each instance has independent middleware!
```

### 4. Built-in Error Handling & Retry

```javascript
const api = createFej({
  retry: { attempts: 3, delay: 1000, exponentialBackoff: true },
  timeout: 5000,
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
```

### 5. Request Cancellation with AbortController

```javascript
const controller = new AbortController();

const api = createFej();
const request = api.get('/users', { signal: controller.signal });

// Cancel the request
controller.abort();
```

### 6. Essential Middleware Utilities

```javascript
import { bearerAuth, logger, retry } from 'fej/middleware';

const api = createFej();

api.use(
  'auth',
  bearerAuth(() => getToken())
);
api.use('logger', logger({ level: 'debug' }));
api.use('retry', retry({ attempts: 3 }));
```

### 7. Modern Tooling & Quality

- ✅ TypeScript 5.x strict mode (zero type errors)
- ✅ ESM + CommonJS dual package
- ✅ Vitest for fast testing
- ✅ 100% public API test coverage
- ✅ Automated CI/CD with GitHub Actions
- ✅ Bundle size monitoring (<10KB enforced)

---

## Breaking Changes

v2 introduces breaking changes to improve the API design. We've carefully planned the migration to minimize pain:

### Changes

1. **Singleton pattern removed** → Use `createFej()` instead
2. **Separate middleware methods unified** → `addMiddleware()` + `addAsyncMiddleware()` become `use()`
3. **`setInit()` removed** → Use constructor configuration
4. **Middleware signature changed** → New pattern with `next()` function
5. **Node.js 18+ required** → For native fetch support
6. **TypeScript 5.0+ recommended** → For TypeScript users

### Migration Support

Don't worry! We're making migration as smooth as possible:

1. **✅ v1.9 with deprecation warnings** (Available NOW)
   - Update to v1.9 first
   - See console warnings showing what to change
   - Your code continues working

2. **✅ Automated migration tool** (codemod)
   - Handles 80%+ of common migrations automatically
   - Preview changes before applying
   - Available with v2.0-alpha

3. **✅ Comprehensive migration guide**
   - Side-by-side comparisons
   - Common patterns covered
   - Troubleshooting section

4. **✅ Compatibility layer** (in v2.0)
   - v1 patterns work with warnings
   - Migrate gradually at your own pace
   - No "big bang" rewrite required

5. **✅ Community support**
   - GitHub Discussions for migration questions
   - Response within 48 hours
   - Migration blockers prioritized

---

## Timeline

```
v1.9 (Deprecation Warnings) ← Available NOW
    ↓ 2 months development
v2.0-alpha (Invite Only) ← ~2 months from now
    ↓ 1 month testing
v2.0-beta (Public)
    ↓ 1 month testing
v2.0-rc (Feature Freeze)
    ↓ 2 weeks validation
v2.0 (Stable Release) ← ~6 months from now
```

### Support Timeline

- **v1.x maintenance**:
  - Security patches: 12 months after v2.0 stable
  - Critical bug fixes: 6 months after v2.0 stable
  - No new features

**Recommendation:** Plan to migrate within 6 months of v2.0 stable release.

---

## How to Prepare

### Step 1: Update to v1.9 Now

```bash
npm install fej@1.9.0
```

Run your application and review the deprecation warnings.

### Step 2: Review the Migration Guide

Read the [Migration Guide](./MIGRATION_GUIDE_V2.md) to understand what's changing.

### Step 3: Plan Your Migration

- Identify all uses of deprecated APIs in your codebase
- Estimate migration effort (typically 1-6 hours for most projects)
- Schedule migration during a low-risk deployment window

### Step 4: Join the Conversation

- GitHub Discussions: Share feedback, ask questions
- GitHub Issues: Report any concerns or blockers
- Help shape v2 by providing input!

### Step 5: Consider Alpha/Beta Testing

Want to help test v2 early? We're looking for alpha testers:

- Diverse use cases (browser, Node.js, frameworks)
- Active communication and feedback
- Willingness to migrate and report issues

**Interested?** Comment on the [v2 Alpha Sign-up Discussion](https://github.com/maxali/fej/discussions)

---

## FAQ

### When should I migrate?

**For most users:** Wait for v2.0-beta or v2.0-rc for stability.

**For early adopters:** Try v2.0-alpha if you want to provide feedback and help shape the final API.

**Right now:** Update to v1.9 to see deprecation warnings and start planning.

### Will my v1 code break?

Your v1 code will continue working in v1.9 and v2.0 (with warnings). The compatibility layer will be removed in v2.1 or v3.0, giving you plenty of time to migrate.

### How long does migration take?

**Typical timelines:**

- Small project (<10 files): 1-2 hours
- Medium project (10-50 files): 3-6 hours
- Large project (50+ files): 1-2 days

The automated codemod can reduce this by 50-80%.

### What if I can't migrate?

v1.x will receive security patches for 12 months after v2.0 stable and critical bug fixes for 6 months. You'll have plenty of time.

### Will v2 be larger?

v2 targets <10KB minified (full library) with typical usage around 6-8KB thanks to tree-shaking. That's only slightly larger than v1's ~3KB, despite adding many new features.

### Can I try v2 now?

v2.0-alpha will be available in ~2 months. Sign up for the alpha program in GitHub Discussions to get early access.

---

## What's NOT in v2.0

To maintain quality and realistic timelines, some features are deferred to v2.1+:

**Deferred to future versions:**

- Circuit breaker pattern (v2.1+)
- Request deduplication (v2.1+)
- Advanced caching layer (v2.2+ as optional plugin)
- Additional framework integrations beyond React (v2.3+)
- Performance monitoring (v2.2+)

v2.0 focuses on **essential features** done right, not feature bloat.

---

## How You Can Help

### 1. Spread the Word

- ⭐ Star the repository
- 📢 Share this announcement
- 💬 Discuss in your team/community

### 2. Provide Feedback

- Comment on the [v2 Discussion](https://github.com/maxali/fej/discussions)
- Review the [V2 Plan](./V2_PLAN.md)
- Suggest improvements

### 3. Test Early

- Sign up for alpha testing
- Report bugs during beta
- Share migration experiences

### 4. Contribute

- Documentation improvements
- Example contributions
- Bug fixes
- Feature ideas for v2.1+

---

## Resources

- **Migration Guide**: [MIGRATION_GUIDE_V2.md](./MIGRATION_GUIDE_V2.md)
- **V2 Plan**: [V2_PLAN.md](./V2_PLAN.md)
- **GitHub Discussions**: https://github.com/maxali/fej/discussions
- **Issue Tracker**: https://github.com/maxali/fej/issues
- **npm Package**: https://www.npmjs.com/package/fej

---

## Stay Updated

- Watch the repository for updates
- Join GitHub Discussions
- Follow announcements in CHANGELOG.md

---

## Thank You

Thank you to everyone who has used fej, reported bugs, and provided feedback. Your input has been invaluable in shaping v2.

Special thanks to the early v1 adopters who helped identify the issues we're fixing in v2!

---

**Questions?** Open a discussion in GitHub Discussions or reach out in the issues.

**Excited about v2?** Star the repo and share this announcement!

---

_Last Updated: October 2025_
_Status: v1.9 Available, v2.0-alpha in ~2 months_
