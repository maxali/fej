# 🚀 Announcing fej v2.0-alpha: Invite-Only Testing Program

**Status**: Alpha Testing
**Version**: 2.0.0-alpha.0
**Availability**: Invite-only (10-20 testers)
**Duration**: 4 weeks

---

## TL;DR

We're excited to announce the alpha release of **fej v2.0** - a major evolution of the lightweight, zero-dependency fetch wrapper! We're looking for **10-20 testers** to help validate the new features before public beta.

**🎯 What's New in v2?**
- Instance-based API (no more singleton!)
- Unified middleware with `next()` pattern
- Built-in error handling & retry
- AbortController integration
- Named middleware with priorities
- Still zero dependencies, <10KB

**📋 How to Participate:**
1. Read the [Alpha Testing Guide](./ALPHA_TESTING_GUIDE.md)
2. Apply via [GitHub Discussion](link-to-discussion)
3. Get selected (10-20 spots available)
4. Test and provide feedback for 4 weeks

---

## What is fej v2?

fej (Fetch with JavaScript) is evolving from a simple fetch wrapper into a powerful, middleware-based HTTP client - while maintaining its core philosophy: **simple, focused, zero dependencies**.

### The Journey So Far

- **v1.0** (2020): Simple singleton fetch wrapper
- **v1.6** (Current): Middleware support, async/sync patterns
- **v2.0** (Alpha): Complete rewrite with modern patterns

### Why v2?

v1 was great for basic use cases, but as projects grew, users needed:
- ✅ Better error handling and retry mechanisms
- ✅ Request cancellation (AbortController)
- ✅ Multiple independent instances
- ✅ More powerful middleware patterns
- ✅ Better TypeScript support

v2 delivers all of this while keeping the bundle <10KB and zero production dependencies.

---

## What's New in v2.0-alpha

### 🔥 Major Features

#### 1. Instance-Based API
**No more singleton!** Create multiple independent instances with isolated configuration.

```javascript
// v1 (singleton)
import Fej from 'fej';
Fej.setInit({ headers: {...} });

// v2 (instance-based)
import { createFej } from 'fej';
const api = createFej({
  baseURL: 'https://api.example.com',
  headers: { 'Content-Type': 'application/json' }
});
```

**Benefits:**
- Multiple instances for different APIs
- No global state pollution
- Better testability
- Clearer configuration

---

#### 2. Unified Middleware API
**One pattern for all middleware.** No more separate sync/async methods.

```javascript
// v1 (two separate methods)
Fej.addMiddleware((init) => ({ headers: {...} }));
Fej.addAsyncMiddleware(async (init) => { ... });

// v2 (unified)
api.use('auth', async (request, next) => {
  // Modify request
  request.headers.set('Authorization', await getToken());

  // Call next middleware
  await next();

  // Optional: modify response
  return request;
});
```

**Benefits:**
- Named middleware for better organization
- Priority-based execution order
- Remove middleware by name
- Request AND response transformation
- Koa-style onion model

---

#### 3. Error Handling & Retry
**Built-in retry logic with custom error types.**

```javascript
const api = createFej({
  retry: {
    attempts: 3,
    delay: 1000,
    exponentialBackoff: true
  },
  timeout: 5000
});

api.use('error-handler', async (request, next) => {
  try {
    await next();
  } catch (error) {
    if (error instanceof FejTimeoutError) {
      console.error('Request timed out');
    } else if (error instanceof FejRetryError) {
      console.error('All retry attempts failed');
    }
    throw error;
  }
});
```

**Features:**
- `FejError`, `FejTimeoutError`, `FejRetryError` types
- Configurable retry with exponential backoff
- Error middleware support
- Error transformation hooks

---

#### 4. AbortController Integration
**Cancel requests with native AbortController.**

```javascript
// Cancel specific request
const controller = new AbortController();
api.get('/slow', { signal: controller.signal });
controller.abort();

// Cancel by tag
api.get('/users', { tags: ['user-data'] });
api.get('/posts', { tags: ['user-data'] });
api.cancelByTag('user-data'); // Cancels both
```

**Features:**
- Native AbortController support
- Tag-based request grouping
- Automatic timeout integration
- Lifecycle management

---

#### 5. Built-in Middleware Utilities
**Common patterns ready to use.**

```javascript
import { bearerToken, logger, retry } from 'fej';

const api = createFej();

// Authentication
api.use('auth', bearerToken(() => getToken()));

// Logging
api.use('logger', logger('detailed'));

// Retry
api.use('retry', retry({ attempts: 3, delay: 1000 }));
```

---

### 💪 Under the Hood

- **TypeScript 5.x** with strict mode
- **Zero `any` types** - full type safety
- **Modern tooling** - tsup, Vitest, ESLint 9
- **ESM + CJS** dual package support
- **319 tests** - 100% public API coverage
- **7.67 KB bundle** - well under 10KB target
- **Tree-shakeable** - import only what you use

---

## Breaking Changes

v2 introduces intentional breaking changes to improve the API:

### 1. Singleton → Instance-Based ⚠️
**Old:**
```javascript
import Fej from 'fej';
Fej.setInit({ ... });
```

**New:**
```javascript
import { createFej } from 'fej';
const api = createFej({ ... });
```

### 2. Middleware Methods → Unified `use()` ⚠️
**Old:**
```javascript
Fej.addMiddleware((init) => ({ ... }));
Fej.addAsyncMiddleware(async (init) => ({ ... }));
```

**New:**
```javascript
api.use('name', async (request, next) => {
  // modify request
  await next();
  // modify response (optional)
  return request;
});
```

### 3. Method Calls → Instance Methods ⚠️
**Old:**
```javascript
Fej.fej('/api/users');
```

**New:**
```javascript
api.get('/users');
// or
api.fetch('/users');
```

**📚 Full migration guide:** [MIGRATION_GUIDE_V2.md](./MIGRATION_GUIDE_V2.md)

---

## Alpha Testing Program

### What is Alpha Testing?

Alpha is the **first external testing phase** where we:
- Validate core features with real users
- Gather feedback on API design
- Find bugs before public beta
- Test migration experience

### What to Expect (Alpha Testers)

**⚠️ This is alpha software:**
- Breaking changes may still occur
- You will encounter bugs
- Documentation is incomplete
- Frequent updates expected

**🎯 Your role:**
- Test v2 in non-production environment
- Report bugs and provide feedback
- Participate in weekly check-ins (4 weeks)
- Help improve migration guide

### How to Apply

**📋 Requirements:**
- Proficient in JavaScript/TypeScript
- Experience with HTTP clients
- Active project to test with (non-production)
- Can dedicate 3-5 hours/week for 4 weeks
- Responsive communication (48h response time)

**📝 Application Process:**
1. Read [Alpha Testing Guide](./ALPHA_TESTING_GUIDE.md)
2. Read [Alpha Tester Selection](./ALPHA_TESTER_SELECTION.md)
3. Open GitHub Discussion with application (use template)
4. Wait for selection notification (3 days)

**🎯 What We're Looking For:**
- Diversity in use cases (REST, GraphQL, browser, Node.js)
- Mix of experience levels (beginner, intermediate, advanced)
- Different project sizes (small, medium, large)
- TypeScript and JavaScript users

**⏰ Timeline:**
- **Applications Open**: [TBD]
- **Applications Close**: [TBD] (or when 20 spots filled)
- **Selection**: Within 3 days
- **Alpha Start**: [TBD]
- **Duration**: 4 weeks

---

## Installation (Alpha Testers Only)

```bash
# Install alpha version
npm install fej@alpha

# Verify installation
npm list fej
# Should show: fej@2.0.0-alpha.0
```

**⚠️ Do NOT use in production!**

---

## Resources

### Documentation
- 📖 [Alpha Testing Guide](./ALPHA_TESTING_GUIDE.md) - Start here!
- 📖 [Migration Guide v1→v2](./MIGRATION_GUIDE_V2.md)
- 📖 [Alpha Tester Selection](./ALPHA_TESTER_SELECTION.md)
- 📖 [Alpha Release Notes](./ALPHA_RELEASE_NOTES.md)

### Feature Guides (v2)
- 🔧 [Middleware Management](./docs/MIDDLEWARE_MANAGEMENT.md)
- 🔧 [Error Handling & Retry](./docs/ERROR_HANDLING_RETRY.md)
- 🔧 [AbortController Integration](./docs/ABORT_CONTROLLER.md)
- 🔧 [Middleware Utilities](./docs/MIDDLEWARE_UTILITIES.md)

### Community
- 💬 [GitHub Discussions](https://github.com/maxali/fej/discussions) - Apply here!
- 🐛 [GitHub Issues](https://github.com/maxali/fej/issues) - Report bugs
- 📦 [npm Package](https://www.npmjs.com/package/fej)

---

## What's Next?

### Roadmap to Stable

```
✅ Phase 0-2: Foundation & Core Features (COMPLETE)
✅ Phase 2.5: Integration & Polish (COMPLETE)
✅ Phase 3: Documentation (IN PROGRESS)
▶️ Phase 4.1: Alpha Release (4 weeks) ← WE ARE HERE
   Phase 4.2: Beta Release (Public, 1 month)
   Phase 4.3: Release Candidate (2 weeks)
   Phase 4.4: Stable Release (v2.0.0) 🚀
```

**Timeline:**
- **Alpha**: 4 weeks (invite-only)
- **Beta**: 1 month (public testing)
- **RC**: 2 weeks (feature freeze)
- **Stable**: Target Q1 2026

### After Stable Release

**v2.1+ Features (Deferred from v2.0):**
- Circuit breaker pattern
- Request deduplication
- Advanced caching layer
- Performance monitoring
- Additional middleware utilities
- Vue/Svelte integrations

---

## For Current v1 Users

### Should I Migrate Now?

**🟡 Alpha (Now):**
- ❌ Do NOT use in production
- ✅ Test in dev/staging environment
- ✅ Provide feedback to shape v2
- ✅ Get ahead of migration

**🟢 Beta (Public, ~1 month):**
- ❌ Still not production-ready
- ✅ More stable than alpha
- ✅ Good for integration testing
- ✅ Migration guide finalized

**🚀 Stable (Target Q1 2026):**
- ✅ Production-ready
- ✅ Recommended upgrade timeline: 6 months
- ✅ v1 maintenance: Security patches for 12 months

### v1 Support Timeline

- **v1.x Security Patches**: 12 months after v2.0 stable
- **v1.x Bug Fixes**: 6 months after v2.0 stable
- **v1.x New Features**: None (EOL)
- **Recommendation**: Migrate within 6 months of v2.0 stable

---

## FAQ

### Q: Why alpha instead of directly to beta?
**A:** Alpha allows us to validate API design with a small group before public testing. Major changes can still happen in alpha.

### Q: Will alpha break my code?
**A:** Potentially yes. Alpha is for testing only, not production. API may change based on feedback.

### Q: Can I use v2 features in v1?
**A:** No. v2 is a complete rewrite with breaking changes. Upgrade to v2 when stable.

### Q: Is v2 faster than v1?
**A:** We don't have quantitative data (Phase 0 was skipped), but v2 includes optimizations. Performance testing happens in beta.

### Q: Will migration be hard?
**A:** Depends on your usage. We provide:
- Comprehensive migration guide
- Automated codemod tool (coming soon)
- Before/after examples
- Alpha testers will validate migration experience

### Q: Can I contribute to v2?
**A:** Yes! After alpha, we'll accept PRs for v2.1+ features. Alpha focus is on testing existing features.

### Q: When will v2 be stable?
**A:** Target Q1 2026. Timeline may adjust based on alpha/beta feedback.

---

## Get Involved

### Alpha Tester
- Read [Alpha Testing Guide](./ALPHA_TESTING_GUIDE.md)
- Apply via GitHub Discussion
- Commit to 4 weeks of testing

### Stay Updated
- ⭐ Star the repo: https://github.com/maxali/fej
- 👀 Watch for releases
- 💬 Join discussions

### Spread the Word
- Share this announcement
- Tweet about v2 alpha
- Blog about your testing experience

---

## Acknowledgments

Special thanks to:
- **v1 users** - Your feedback shaped v2
- **Early adopters** - For trusting fej in your projects
- **Contributors** - For bug reports and suggestions
- **Alpha testers** - For helping validate v2

---

## Thank You! 🙏

We're excited to embark on this journey to v2.0 with your help!

**Let's build something great together.**

---

**Questions?**
- Open a [GitHub Discussion](https://github.com/maxali/fej/discussions)
- Read the [Alpha Testing Guide](./ALPHA_TESTING_GUIDE.md)
- Check [Migration Guide](./MIGRATION_GUIDE_V2.md)

---

**Project**: [maxali/fej](https://github.com/maxali/fej)
**npm**: [fej@alpha](https://www.npmjs.com/package/fej)
**License**: ISC
**Maintainer**: [@maxali](https://github.com/maxali)

---

*Last Updated: 2025-10-17*
*Alpha Version: 2.0.0-alpha.0*
