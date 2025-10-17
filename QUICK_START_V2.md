# Quick Start: fej v2 Development

This guide helps you get started quickly with fej v2 development. For complete details, see the full documentation.

---

## 📖 Documentation Overview

| Document                                                   | Purpose                  | Audience                 |
| ---------------------------------------------------------- | ------------------------ | ------------------------ |
| [PROJECT_REVIEW.md](./PROJECT_REVIEW.md)                   | Current state analysis   | Everyone                 |
| [V2_PLAN.md](./V2_PLAN.md)                                 | Complete v2 roadmap      | Stakeholders, developers |
| [V2_IMPLEMENTATION_GUIDE.md](./V2_IMPLEMENTATION_GUIDE.md) | Technical specifications | Developers               |
| [CONTRIBUTING.md](./CONTRIBUTING.md)                       | Contribution guidelines  | Contributors             |
| [ROADMAP.md](./ROADMAP.md)                                 | Long-term vision         | Everyone                 |
| [CHANGELOG.md](./CHANGELOG.md)                             | Version history          | Everyone                 |

---

## 🎯 Key Findings from Review

### ✅ Strengths

- Clean, minimal API design
- Zero dependencies
- TypeScript support
- Focused purpose

### ❌ Critical Issues

1. **Async middleware bug** (line 63) - awaits array instead of results
2. **Incorrect async declaration** (line 27) - addMiddleware shouldn't be async
3. **Outdated dependencies** - TypeScript 3.5.2, deprecated TSLint
4. **Minimal testing** - Only one basic test
5. **Type safety issues** - Uses `any` in several places

### 🎯 Assessment Score: 6/10

- Concept: 9/10 ✨
- Implementation: 5/10 ⚠️
- Testing: 2/10 ⚠️
- Documentation: 5/10 ⚠️
- Maintenance: 4/10 ⚠️

---

## 🚀 v2.0 Overview

### Goals

1. Fix all critical bugs
2. Modernize tooling
3. Test all public APIs with comprehensive test cases
4. Improve developer experience
5. Add 8-10 essential features only (70% scope reduction from original plan)

### Scope Philosophy: MVP First

This v2.0 focuses on **essential features only**. Advanced features (circuit breaker, caching, deduplication, monitoring) are intentionally deferred to v2.1+ to ensure high quality and realistic timeline.

### Timeline: 6-8 months (part-time, 25-30h/week)

**Total Effort:** 655-900 hours (realistic estimates with proper testing and documentation)

```
Phase 0: Preparation (3-4 weeks)    ████░░░░░░░░░░░░░░░░░░░░░░░░
Phase 1: Foundation (5-7 weeks)     ░░░░████████░░░░░░░░░░░░░░░░
Phase 2: Features (6-8 weeks)       ░░░░░░░░░░░░██████████░░░░░░
Phase 3: Documentation (4-5 weeks)  ░░░░░░░░░░░░░░░░░░░░░░████░░
Phase 4: Launch (10-14 weeks)       ░░░░░░░░░░░░░░░░░░░░░░░░████
```

---

## 🔧 Phase 1: Foundation (PRIORITY)

### Week 1-2: Critical Fixes

```typescript
// ❌ Current bug (line 63-64)
const mdwResults = await Promise.all(this.asyncMiddleWares);
await Promise.all(mdwResults.map(async (asyncMiddleware) => { ... }));

// ✅ Fixed version
const mdwResults = await Promise.all(
  this.asyncMiddleWares.map(asyncMiddleware => asyncMiddleware(_init))
);

// ❌ Current bug (line 27)
public addMiddleware = async (fn: IFejMiddleware) => { ... }

// ✅ Fixed version
public addMiddleware = (fn: IFejMiddleware) => { ... }
```

### Week 2-3: Modernization

- [ ] Upgrade TypeScript 3.5.2 → 5.x
- [ ] Replace TSLint → ESLint + Prettier
- [ ] Add Vitest for testing
- [ ] Set up GitHub Actions CI/CD
- [ ] Configure tsup for building

### Package Updates

```json
{
  "devDependencies": {
    "typescript": "^5.3.3",
    "eslint": "^8.55.0",
    "@typescript-eslint/parser": "^6.15.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "prettier": "^3.1.1",
    "vitest": "^1.0.4",
    "tsup": "^8.0.1"
  }
}
```

---

## 🎨 Phase 2: Core Features

### Scope: Essential Features Only (8-10 features)

**Included in v2.0:**

- ✅ Named middleware with priority ordering
- ✅ Error handling + basic retry
- ✅ AbortController integration
- ✅ 3 essential middleware utilities (auth, logger, retry)
- ✅ Modern tooling and testing
- ✅ ONE framework integration (React hooks)

**Deferred to v2.1+:**

- ❌ Circuit breaker (too complex for zero-dependency)
- ❌ Caching layer (would require lru-cache dependency)
- ❌ Request deduplication (not essential)
- ❌ Performance monitoring (nice-to-have)
- ❌ Additional framework integrations (Vue, Svelte)

### New API Design (Unified Middleware Concept)

```typescript
// v1 (backward compatible)
import Fej from 'fej';
Fej.setInit({ headers: {...} });
Fej.addMiddleware(fn);

// v2 (new API - Single Middleware Concept)
import { createFej } from 'fej';

const api = createFej({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

// Named middleware with priority (Koa-style onion model)
api.use('auth', async (request, next) => {
  const token = await getToken();
  request.headers.set('Authorization', `Bearer ${token}`);
  await next();
  return request;
}, { priority: 100 }); // Higher priority = runs earlier

// Logger middleware (runs before and after request)
api.use('logger', async (request, next) => {
  console.log(`→ ${request.method} ${request.url}`);
  const start = Date.now();

  await next(); // Execute request

  const duration = Date.now() - start;
  console.log(`← ${request.method} ${request.url} (${duration}ms)`);
  return request;
});

// Error handling middleware
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

// Convenience methods
const users = await api.get('/users');
const user = await api.post('/users', { name: 'John' });
```

**Key Change:** ❌ **Removed separate "interceptors"** concept - Everything is now middleware. This simplifies the API from 3 concepts (middleware + interceptors + hooks) to just 1 (middleware).

---

## 📊 Testing Strategy

### Coverage Goals (SMART Criteria - NOT Vanity Metrics)

**We do NOT use percentage-based coverage** (80%, 90%) because:

- Coverage percentages can be gamed (trivial tests increase coverage without testing behavior)
- High coverage does NOT equal good tests
- Focus should be on meaningful test cases, not hitting arbitrary percentages

**Instead, we use specific, measurable criteria:**

- ✅ **All public APIs tested**: Every function exported in `src/index.ts` has unit tests
  - Minimum per function: 3 test cases (success case, error case, edge case)
  - Verification: CI check fails if public API lacks corresponding test file

- ✅ **All error conditions tested**: Every `throw` and `catch` block has test
  - Network errors, timeout errors, abort errors, validation errors

- ✅ **All middleware scenarios tested**: Integration tests for complete request flow
  - Single middleware execution
  - Multiple middleware in priority order
  - Middleware error propagation
  - AbortController cancellation

- ✅ **Browser compatibility**: Chrome 120+, Firefox 120+, Safari 17+, Edge 120+
  - CI runs tests in actual browsers (NOT E2E - libraries don't need E2E)

### Test Structure

```typescript
describe('Fej', () => {
  describe('use()', () => {
    it('should register middleware');
    it('should execute middleware in priority order');
    it('should handle async middleware');
    it('should support middleware removal');
    it('should filter by path');
    it('should filter by method');
  });

  describe('request()', () => {
    it('should make basic requests');
    it('should apply middleware chain');
    it('should handle errors in middleware');
    it('should support retry mechanism');
    it('should support timeout with AbortController');
    it('should cancel pending requests');
  });
});
```

---

## 🛠️ Development Workflow

### Initial Setup

```bash
# Clone and setup
git clone https://github.com/maxali/fej.git
cd fej
npm install

# Create feature branch
git checkout -b feature/phase1-fixes
```

### Development Cycle

```bash
# 1. Make changes
vim src/index.ts

# 2. Run tests in watch mode
npm test -- --watch

# 3. Lint and format
npm run lint
npm run format

# 4. Build
npm run build

# 5. Commit
git add .
git commit -m "fix: correct async middleware execution"

# 6. Push and create PR
git push origin feature/phase1-fixes
```

### Pre-commit Checklist

- [ ] All tests passing
- [ ] No lint errors
- [ ] Code formatted
- [ ] Types correct
- [ ] Documentation updated

---

## 📝 Documentation Requirements

### Code Documentation

````typescript
/**
 * Register a middleware function
 *
 * @param middleware - The middleware function to register
 * @param config - Optional middleware configuration
 * @returns A unique identifier for the middleware
 *
 * @example
 * ```typescript
 * const id = api.use((req, next) => {
 *   req.headers.set('X-Custom', 'value');
 *   return next().then(() => req);
 * });
 * ```
 */
use(middleware: Middleware, config?: MiddlewareConfig): symbol
````

### Documentation Types

1. **JSDoc** - Inline code documentation
2. **API Reference** - Generated from JSDoc
3. **Guides** - How-to articles
4. **Examples** - Real-world usage
5. **Migration** - v1 to v2 guide

---

## 🚦 Success Criteria (SMART Goals)

### Phase 1 Complete When:

- [ ] All critical bugs fixed (P0/P1 bugs = 0)
- [ ] Tests passing with modern tooling (Vitest, TypeScript 5.x)
- [ ] TypeScript strict mode passing (`tsc --noEmit` exits with 0)
- [ ] CI/CD pipeline running on all PRs within 5 minutes
- [ ] All Phase 1 public APIs have unit tests (not coverage %, but all APIs tested)

### v2.0 Release Ready When:

- [ ] All phases complete (0, 1, 2, 3, 4)
- [ ] All public APIs tested with 3+ test cases each (success, error, edge case)
- [ ] 100% API documentation: All exports have JSDoc + examples (TypeDoc warnings = 0)
- [ ] Migration guide complete: All breaking changes documented with before/after examples
- [ ] Security audit passed: npm audit clean, zero known vulnerabilities
- [ ] Performance benchmarks met: ≤v1 performance (no regression)
- [ ] Bundle size enforced: <10KB full library (size-limit CI check passing)
- [ ] Zero known P0/P1 bugs (critical = 0)
- [ ] Browser compatibility verified: Chrome 120+, Firefox 120+, Safari 17+, Edge 120+

---

## 🎯 Quick Wins

Things that can be done immediately:

1. **Fix async middleware bug** (1 hour)

   ```typescript
   // Change line 63-64
   const mdwResults = await Promise.all(this.asyncMiddleWares.map((mw) => mw(_init)));
   ```

2. **Remove async from addMiddleware** (5 minutes)

   ```typescript
   // Change line 27
   public addMiddleware = (fn: IFejMiddleware) => {
   ```

3. **Add skipLibCheck to tsconfig** (1 minute)

   ```json
   {
     "compilerOptions": {
       "skipLibCheck": true
     }
   }
   ```

4. **Add more tests** (2-3 hours)
   - Test middleware execution
   - Test async middleware
   - Test deep merge
   - Test error cases

5. **Update package.json scripts** (10 minutes)
   ```json
   {
     "scripts": {
       "test": "vitest",
       "test:coverage": "vitest --coverage"
     }
   }
   ```

---

## 💡 Tips for Contributors

### Getting Started

1. Read [CONTRIBUTING.md](./CONTRIBUTING.md) first
2. Look for "good first issue" labels
3. Comment on issue before starting work
4. Ask questions in GitHub Discussions

### Best Practices

- Write tests before code (TDD)
- Keep PRs small and focused
- Update docs with code changes
- Run full test suite before pushing
- Follow commit message conventions

### Common Mistakes to Avoid

- ❌ Making changes without tests
- ❌ Using `any` type
- ❌ Breaking backward compatibility
- ❌ Skipping documentation
- ❌ Not running linter

---

## 📞 Getting Help

### Questions?

- **GitHub Discussions** - General questions
- **Issues** - Bug reports, feature requests
- **PRs** - Code review and implementation help

### Resources

- TypeScript Handbook
- Vitest Documentation
- Fetch API MDN docs
- Project documentation files

---

## ⚡ Next Steps

### For Maintainers

1. Review and approve this plan
2. Create GitHub project board
3. Create issues for Phase 1 tasks
4. Set up CI/CD pipeline
5. Begin Phase 1 implementation

### For Contributors

1. Star the repository
2. Read the documentation
3. Set up development environment
4. Find a good first issue
5. Start contributing!

---

## 📊 Progress Tracking

Track progress on the [GitHub Project Board](#) (to be created)

### Current Status

```
Phase 1: Foundation         [ Not Started ]
Phase 2: Features           [ Not Started ]
Phase 3: Ecosystem          [ Not Started ]
Phase 4: Launch             [ Not Started ]
```

### Milestones

- [ ] v2.0.0-alpha - Phase 1 complete
- [ ] v2.0.0-beta - Phase 2 complete
- [ ] v2.0.0-rc - Phase 3 complete
- [ ] v2.0.0 - Phase 4 complete

---

## 🎉 Let's Build Something Great!

fej has strong potential to become the go-to middleware solution for fetch API. With focused effort on the improvements outlined in this plan, v2 can deliver:

- 🐛 **Zero critical bugs**
- ✅ **80%+ test coverage**
- 📚 **Complete documentation**
- 🚀 **Modern tooling**
- 💪 **Production-ready quality**
- 🎯 **Clear upgrade path**

**Ready to contribute?** Check out [CONTRIBUTING.md](./CONTRIBUTING.md) and dive in!

---

**Questions?** Open a GitHub Discussion or Issue.

**Want to help?** Look for issues labeled `good first issue` or `help wanted`.

**Stay updated:** Watch the repository for releases and announcements.
