# fej v2.0.0-alpha.0 Release Notes

**Release Date**: 2025-10-17
**Release Type**: Invite-Only Alpha
**npm Tag**: `alpha`
**Status**: Pre-release (Not Production Ready)

---

## ⚠️ Important Notice

**This is an ALPHA release for testing purposes only.**

- ❌ **DO NOT use in production**
- ⚠️ API may change based on feedback
- 🐛 Bugs are expected
- 📝 Documentation is incomplete
- 🔄 Frequent updates expected

**Target Audience**: 10-20 selected alpha testers
**Testing Period**: 4 weeks
**Feedback Channels**: GitHub Discussions, Issues

---

## 🎉 What's New in v2.0-alpha

### Major Features

#### 1. Instance-Based API (Breaking Change)
Replace singleton pattern with factory function for multiple independent instances.

**Before (v1):**
```javascript
import Fej from 'fej';
Fej.setInit({ headers: { 'Content-Type': 'application/json' } });
const response = await Fej.fej('/api/users');
```

**After (v2):**
```javascript
import { createFej } from 'fej';

const api = createFej({
  baseURL: 'https://api.example.com',
  headers: { 'Content-Type': 'application/json' }
});

const response = await api.get('/users');
```

**Benefits:**
- Create multiple instances with isolated configuration
- No global state pollution
- Better testability
- Clearer initialization

---

#### 2. Unified Middleware API (Breaking Change)
Single `use()` method replaces separate sync/async middleware functions.

**Before (v1):**
```javascript
Fej.addMiddleware((init) => ({ headers: { 'X-Custom': 'value' } }));
Fej.addAsyncMiddleware(async (init) => {
  const token = await getToken();
  return { headers: { Authorization: `Bearer ${token}` } };
});
```

**After (v2):**
```javascript
api.use('custom-header', async (request, next) => {
  request.headers.set('X-Custom', 'value');
  await next();
  return request;
});

api.use('auth', async (request, next) => {
  const token = await getToken();
  request.headers.set('Authorization', `Bearer ${token}`);
  await next();
  return request;
}, { priority: 100 }); // High priority = runs first
```

**Features:**
- Named middleware for easy management
- Priority-based execution order
- Remove middleware by name: `api.removeMiddleware('auth')`
- Koa-style onion model with `next()`
- Transform both request and response

---

#### 3. Error Handling & Retry
Built-in retry mechanism with custom error types.

```javascript
import { createFej, FejError, FejTimeoutError, FejRetryError } from 'fej';

const api = createFej({
  retry: {
    attempts: 3,
    delay: 1000,
    exponentialBackoff: true,
    retryOn: [500, 502, 503, 504]
  },
  timeout: 5000
});

// Error middleware
api.use('error-handler', async (request, next) => {
  try {
    await next();
    return request;
  } catch (error) {
    if (error instanceof FejTimeoutError) {
      console.error('Request timed out after 5s');
    } else if (error instanceof FejRetryError) {
      console.error('All 3 retry attempts failed');
    }
    throw error;
  }
});
```

**Features:**
- `FejError`: Base error with request context
- `FejTimeoutError`: Timeout-specific errors
- `FejRetryError`: Retry exhaustion errors
- Configurable retry with exponential backoff
- Error middleware support
- Error transformation hooks

---

#### 4. AbortController Integration
Native request cancellation support.

```javascript
// Cancel specific request
const controller = new AbortController();
api.get('/slow-endpoint', { signal: controller.signal });

// Cancel after timeout
setTimeout(() => controller.abort(), 1000);

// Cancel by tag
api.get('/users', { tags: ['user-data'] });
api.get('/posts', { tags: ['user-data'] });
api.get('/comments', { tags: ['user-data'] });

api.cancelByTag('user-data'); // Cancels all three requests

// Automatic cleanup
api.cancel(); // Cancel all pending requests
```

**Features:**
- Native AbortController integration
- Tag-based request grouping and cancellation
- Automatic timeout integration
- Lifecycle management and cleanup
- Cancellation middleware support

---

#### 5. Built-in Middleware Utilities
Common patterns ready to use.

```javascript
import { bearerToken, logger, retry } from 'fej';

const api = createFej();

// Bearer token authentication
api.use('auth', bearerToken(() => getToken()));

// Logging middleware
api.use('logger', logger('detailed')); // 'simple' | 'detailed' | custom function

// Retry middleware
api.use('retry', retry({ attempts: 3, delay: 1000 }));
```

**Available Utilities:**
- `bearerToken(tokenGetter)`: Bearer token authentication
- `logger(format)`: Request/response logging (3 formats)
- `retry(config)`: Retry failed requests

---

### API Changes Summary

#### New Exports
```typescript
// Factory function
export function createFej(config?: FejConfig): FejInstance;

// Middleware utilities
export function bearerToken(tokenGetter: () => string | Promise<string>): FejMiddlewareFunction;
export function logger(format: 'simple' | 'detailed' | LoggerFunction): FejMiddlewareFunction;
export function retry(config: RetryConfig): FejMiddlewareFunction;

// Error types
export class FejError extends Error { ... }
export class FejTimeoutError extends FejError { ... }
export class FejRetryError extends FejError { ... }

// Types
export type FejConfig = { ... };
export type FejInstance = { ... };
export type FejMiddlewareFunction = (context: FejContext, next: NextFunction) => Promise<void>;
export type FejContext = { ... };
```

#### Deprecated (v1 APIs)
```typescript
// These still work but show deprecation warnings
export default Fej; // Singleton - use createFej() instead
Fej.setInit(); // Use createFej({ ... }) instead
Fej.addMiddleware(); // Use api.use() instead
Fej.addAsyncMiddleware(); // Use api.use() instead
Fej.fej(); // Use api.get/post/fetch() instead
```

---

## 🔧 Technical Improvements

### TypeScript
- **TypeScript 5.3**: Upgraded from 3.x
- **Strict Mode**: All strict flags enabled
- **Zero `any` Types**: Full type safety
- **Better Inference**: Improved type inference for middleware
- **Type Tests**: 22 type tests with expect-type

### Tooling
- **Vitest**: Modern test runner (replaced Jest-like setup)
- **tsup**: Fast bundler (replaced manual webpack)
- **ESLint 9**: Modern linting (replaced TSLint)
- **Prettier**: Consistent formatting
- **GitHub Actions**: Multi-Node CI/CD (18, 20, 22)

### Build
- **ESM + CJS**: Dual package with proper exports
- **TypeScript Declarations**: Full .d.ts files
- **Tree-Shakeable**: Import only what you need
- **Source Maps**: Debugging support

### Testing
- **319 Tests**: Comprehensive test coverage
- **100% Public API Coverage**: Every API tested
- **Unit Tests**: 211 tests for core functionality
- **Integration Tests**: 35 tests for real HTTP scenarios
- **Type Tests**: 22 tests for TypeScript types
- **Performance Tests**: 11 benchmark tests
- **Browser Tests**: 46 cross-browser compatibility tests

---

## 📦 Bundle Size

**Target**: <10KB minified
**Actual**: **7.67 KB** minified (76.7% of limit)
**Remaining Budget**: 2.33 KB (23.3% headroom)

**Validation**: Automated with `npm run check:size`

---

## 🐛 Bug Fixes

All known v1 bugs have been fixed:

### Critical Bugs Fixed (P0/P1)
1. ✅ **Async middleware execution**: Fixed race conditions in async middleware
2. ✅ **Deep merge edge cases**: Corrected nested object merging
3. ✅ **Header handling**: Fixed Headers object merging
4. ✅ **Error boundaries**: Proper error propagation through middleware

### Issues Resolved
- Fixed incorrect `async` keyword on `addMiddleware` (now removed)
- Fixed deep merge replacing arrays incorrectly
- Fixed middleware execution order inconsistencies
- Fixed null/undefined handling in configuration
- Fixed memory leaks in long-running processes

### Regression Tests
All bug fixes include regression tests to prevent reoccurrence.

---

## 📚 Documentation

### New Documentation
- ✅ [MIGRATION_GUIDE_V2.md](./MIGRATION_GUIDE_V2.md): Complete v1→v2 migration guide
- ✅ [ALPHA_TESTING_GUIDE.md](./ALPHA_TESTING_GUIDE.md): Alpha tester handbook
- ✅ [ALPHA_TESTER_SELECTION.md](./ALPHA_TESTER_SELECTION.md): Application guide

### Feature Guides (4 comprehensive guides)
- ✅ [Middleware Management](./docs/MIDDLEWARE_MANAGEMENT.md)
- ✅ [Error Handling & Retry](./docs/ERROR_HANDLING_RETRY.md)
- ✅ [AbortController Integration](./docs/ABORT_CONTROLLER.md)
- ✅ [Middleware Utilities](./docs/MIDDLEWARE_UTILITIES.md)

### In Progress (Phase 3)
- 🟡 JSDoc coverage: ~40% complete (will reach 100% in Phase 3.1)
- 🟡 TypeDoc generation: Configured but needs completion
- 🟡 API reference: Being finalized
- 🟡 Troubleshooting guide: In progress

---

## ⚙️ Installation

### For Alpha Testers

```bash
# Install alpha version
npm install fej@alpha

# Verify installation
npm list fej
# Should show: fej@2.0.0-alpha.0
```

### Requirements
- **Node.js**: 18.0.0 or higher
- **npm**: 7+ (or pnpm 8+, yarn 1.22+)
- **TypeScript**: 5.0+ (if using TypeScript)

---

## 🚨 Breaking Changes

### 1. Import Changes
```diff
- import Fej from 'fej';
+ import { createFej } from 'fej';
```

### 2. Initialization
```diff
- Fej.setInit({ headers: { ... } });
+ const api = createFej({ headers: { ... } });
```

### 3. Middleware
```diff
- Fej.addMiddleware((init) => ({ headers: { ... } }));
- Fej.addAsyncMiddleware(async (init) => ({ headers: { ... } }));
+ api.use('name', async (request, next) => {
+   request.headers.set('X-Header', 'value');
+   await next();
+   return request;
+ });
```

### 4. Request Methods
```diff
- const response = await Fej.fej('/api/users');
+ const response = await api.get('/users');
+ // or
+ const response = await api.fetch('/users');
```

### Migration Guide
See [MIGRATION_GUIDE_V2.md](./MIGRATION_GUIDE_V2.md) for complete migration instructions.

---

## 📋 Known Issues

### Documentation (Phase 3 Work)
- ⚠️ JSDoc coverage incomplete (~40%)
- ⚠️ TypeDoc generation has minor warnings
- ⚠️ Some API methods lack inline examples

### Limitations
- ⚠️ No v1 performance baseline (Phase 0 skipped)
  - Cannot quantify "X% faster than v1" claims
  - v2 performance becomes new baseline
- ⚠️ Codemod tool not yet available (coming soon)
- ⚠️ No backward compatibility layer in alpha

### By Design (Not Bugs)
- Deprecation warnings for v1 APIs (intentional)
- Breaking changes from v1 (documented)
- Alpha instability (expected in pre-release)

---

## 🔄 Alpha Testing Process

### For Selected Testers

**Week 1**: Installation & Core Features
- Install alpha version
- Test basic requests (GET, POST, PUT, DELETE)
- Test middleware basics (named, priority, removal)
- Report initial feedback

**Week 2**: Advanced Features
- Test error handling & retry
- Test AbortController integration
- Test built-in utilities
- Report findings

**Week 3**: Real-World Integration
- Integrate into your project
- Test authentication flows
- Test edge cases
- Report integration experience

**Week 4**: Final Feedback
- Complete testing checklist
- Review documentation
- Provide comprehensive feedback
- Help shape beta release

### How to Provide Feedback

1. **Bugs**: GitHub Issues with `alpha-feedback` label
2. **General Feedback**: GitHub Discussions (v2 Alpha Feedback)
3. **Migration Issues**: GitHub Issues with `v2-migration` label
4. **Weekly Updates**: Weekly Check-In discussions

### Response Times
- **P0 (Critical)**: 24 hours
- **P1 (High)**: 48 hours
- **P2/P3**: 1 week
- **Questions**: 48-72 hours

---

## 🎯 Success Criteria

For alpha to be considered successful:

### Technical Goals
- [ ] Zero P0/P1 bugs by end of alpha
- [ ] All core features tested in real projects
- [ ] Migration guide validated by testers
- [ ] API design validated (no major breaking changes requested)

### Feedback Goals
- [ ] At least 5 testers complete full checklist
- [ ] At least 3 testers integrate into real projects
- [ ] At least 10 issues/feedback items reported
- [ ] At least 5 documentation improvements suggested

### Community Goals
- [ ] Active participation in weekly check-ins
- [ ] Constructive feedback and suggestions
- [ ] Help other alpha testers in discussions

---

## 🚀 What's Next

### Immediate (This Alpha Period)
1. Recruit and onboard 10-20 alpha testers
2. 4 weeks of intensive testing and feedback
3. Fix P0/P1 bugs discovered
4. Iterate on API design based on feedback
5. Update documentation based on learnings

### After Alpha (Next Steps)
1. **Beta Release** (Public, ~1 month)
   - Address all alpha feedback
   - Public testing and wider adoption
   - Performance optimization
   - Bundle size verification
   - Security audit

2. **Release Candidate** (~2 weeks)
   - Feature freeze
   - Bug fixes only
   - Final testing across all environments
   - Finalize migration guide

3. **Stable Release** (v2.0.0)
   - Tag as `latest` on npm
   - Full documentation complete
   - Launch announcement
   - Migration support

**Target Timeline**: Q1 2026 for stable release

---

## 🙏 Acknowledgments

### Contributors to v2.0-alpha
- **Maintainer**: [@maxali](https://github.com/maxali)
- **Alpha Testers**: TBD (to be listed after alpha completion)

### Special Thanks
- v1 users for feedback that shaped v2
- Bug reporters who identified v1 issues
- Open source community for inspiration (Koa, ky, wretch)

---

## 📞 Support

### For Alpha Testers
- **GitHub Discussions**: General questions and feedback
- **GitHub Issues**: Bug reports
- **Weekly Check-Ins**: Progress updates and blockers

### Resources
- [Alpha Testing Guide](./ALPHA_TESTING_GUIDE.md)
- [Migration Guide](./MIGRATION_GUIDE_V2.md)
- [Feature Documentation](./docs/)
- [GitHub Repository](https://github.com/maxali/fej)
- [npm Package](https://www.npmjs.com/package/fej)

---

## 📄 License

ISC License - unchanged from v1

---

## 🔗 Links

- **GitHub**: https://github.com/maxali/fej
- **npm**: https://www.npmjs.com/package/fej
- **Discussions**: https://github.com/maxali/fej/discussions
- **Issues**: https://github.com/maxali/fej/issues

---

**Remember**: This is an ALPHA release. Use for testing only, not production.

**Thank you for helping make fej v2.0 amazing!** 🚀

---

*Released: 2025-10-17*
*Version: 2.0.0-alpha.0*
*Next: Public Beta (~1 month)*
