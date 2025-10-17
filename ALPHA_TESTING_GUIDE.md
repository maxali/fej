# Fej v2.0-alpha Testing Guide

> **Alpha Version**: 2.0.0-alpha.0
> **Status**: Invite-Only Alpha Testing
> **Duration**: 4 weeks (extended from 2 weeks)
> **Testing Period**: TBD - TBD
> **Testers**: 10-20 selected participants

---

## Welcome Alpha Testers! 🎉

Thank you for participating in the fej v2.0-alpha testing program! Your feedback is crucial in making v2 a successful release. This guide will help you get started, understand what to test, and how to provide feedback.

---

## Table of Contents

1. [What is Alpha Testing?](#what-is-alpha-testing)
2. [Installation](#installation)
3. [What's New in v2](#whats-new-in-v2)
4. [Testing Checklist](#testing-checklist)
5. [Known Issues](#known-issues)
6. [How to Report Issues](#how-to-report-issues)
7. [Feedback Channels](#feedback-channels)
8. [Timeline & Expectations](#timeline--expectations)

---

## What is Alpha Testing?

Alpha testing is the **first external testing phase** of fej v2. During this phase:

### What to Expect
- ⚠️ **Breaking changes** - APIs may still change based on feedback
- 🐛 **Bugs** - You will likely encounter bugs (that's why we're testing!)
- 📝 **Incomplete documentation** - Some JSDoc may be missing
- 🔄 **Frequent updates** - We'll release alpha patches based on your feedback

### Your Role as Alpha Tester
- 🧪 **Test core features** - Try new v2 features in real projects
- 🐛 **Find and report bugs** - Help us identify issues early
- 💡 **Provide feedback** - Share your experience with the new API
- 📚 **Review documentation** - Help improve migration guide and examples
- 🤝 **Be patient** - This is early-stage software

### What We're NOT Testing
- ❌ Production stability (not ready yet)
- ❌ Performance optimization (happens in beta)
- ❌ Final bundle size (will be optimized in RC)

---

## Installation

### Prerequisites
- Node.js 18.0.0 or higher
- npm 7+ or pnpm 8+ or yarn 1.22+

### Install Alpha Version

```bash
# Using npm
npm install fej@alpha

# Using pnpm
pnpm add fej@alpha

# Using yarn
yarn add fej@alpha
```

### Verify Installation

```bash
npm list fej
# Should show: fej@2.0.0-alpha.0
```

### TypeScript Configuration (if using TypeScript)

Ensure your `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": false
  }
}
```

---

## What's New in v2

### 🎯 Core Changes (HIGH PRIORITY - Test These First)

#### 1. Instance-Based API (Breaking Change)
**Old (v1):**
```javascript
import Fej from 'fej';
Fej.setInit({ headers: {...} });
const response = await Fej.fej('/api/users');
```

**New (v2):**
```javascript
import { createFej } from 'fej';
const api = createFej({
  baseURL: 'https://api.example.com',
  headers: {...}
});
const response = await api.get('/users');
```

**What to Test:**
- ✅ Creating multiple independent instances
- ✅ Configuration isolation between instances
- ✅ Base URL handling
- ✅ Default headers merging

---

#### 2. Unified Middleware API (Breaking Change)
**Old (v1):**
```javascript
Fej.addMiddleware((init) => ({ headers: {...} }));
Fej.addAsyncMiddleware(async (init) => ({ headers: {...} }));
```

**New (v2):**
```javascript
api.use('name', async (request, next) => {
  // Modify request
  request.headers.set('X-Custom', 'value');

  // Call next middleware
  await next();

  // Optional: modify response
  return request;
});
```

**What to Test:**
- ✅ Named middleware
- ✅ Middleware priority/ordering
- ✅ Removing middleware by name
- ✅ Middleware execution with `next()`
- ✅ Request transformation
- ✅ Response transformation (in `next()` callback)

---

#### 3. Error Handling & Retry
**New Feature:**
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
    return request;
  } catch (error) {
    if (error instanceof FejTimeoutError) {
      console.error('Request timed out');
    }
    throw error;
  }
});
```

**What to Test:**
- ✅ Retry mechanism with various failure scenarios
- ✅ Timeout handling
- ✅ Custom error types (FejError, FejTimeoutError, FejRetryError)
- ✅ Error middleware
- ✅ Error transformation

---

#### 4. AbortController Integration
**New Feature:**
```javascript
const api = createFej();

// Cancel specific request
const controller = new AbortController();
api.get('/slow-endpoint', { signal: controller.signal });
controller.abort();

// Cancel by tag
api.get('/users', { tags: ['user-data'] });
api.get('/posts', { tags: ['user-data'] });
api.cancelByTag('user-data'); // Cancels both
```

**What to Test:**
- ✅ Request cancellation with AbortController
- ✅ Tag-based cancellation
- ✅ Timeout integration
- ✅ Cleanup after cancellation
- ✅ Cancellation middleware

---

### 🔧 Built-in Middleware Utilities

```javascript
import { bearerToken, logger, retry } from 'fej';

const api = createFej();

// Bearer token authentication
api.use('auth', bearerToken(() => 'your-token-here'));

// Logging
api.use('logger', logger('detailed')); // 'simple' | 'detailed' | custom

// Retry middleware
api.use('retry', retry({ attempts: 3, delay: 1000 }));
```

**What to Test:**
- ✅ Bearer token middleware
- ✅ Logger middleware (all formats)
- ✅ Retry middleware
- ✅ Combining multiple utilities

---

## Testing Checklist

### Week 1: Core Features
- [ ] **Installation & Setup**
  - [ ] Install alpha version
  - [ ] Create first instance
  - [ ] Configure base URL and headers

- [ ] **Basic Requests**
  - [ ] GET requests
  - [ ] POST requests with JSON body
  - [ ] PUT/PATCH/DELETE requests
  - [ ] Requests with query parameters

- [ ] **Middleware Basics**
  - [ ] Add named middleware
  - [ ] Test middleware execution order
  - [ ] Remove middleware by name
  - [ ] Test priority parameter

### Week 2: Advanced Features
- [ ] **Error Handling**
  - [ ] Test retry mechanism
  - [ ] Test timeout handling
  - [ ] Test error middleware
  - [ ] Test custom error types

- [ ] **AbortController**
  - [ ] Cancel single request
  - [ ] Cancel multiple requests by tag
  - [ ] Test timeout integration
  - [ ] Test cleanup

### Week 3: Real-World Integration
- [ ] **Your Project Integration**
  - [ ] Migrate one module/feature to v2
  - [ ] Test authentication flow
  - [ ] Test error scenarios
  - [ ] Test concurrent requests

- [ ] **Built-in Utilities**
  - [ ] Bearer token middleware
  - [ ] Logger middleware
  - [ ] Retry middleware

### Week 4: Edge Cases & Feedback
- [ ] **Edge Cases**
  - [ ] Nested middleware
  - [ ] Middleware with errors
  - [ ] Race conditions
  - [ ] Memory leaks (1000+ requests)

- [ ] **Documentation Review**
  - [ ] Review migration guide
  - [ ] Test examples from docs
  - [ ] Suggest improvements

- [ ] **Final Feedback**
  - [ ] Overall API experience
  - [ ] Breaking change impact
  - [ ] Missing features
  - [ ] Improvement suggestions

---

## Known Issues

### Critical (P0)
_None currently - please report any you find!_

### High Priority (P1)
_None currently - please report any you find!_

### Medium Priority (P2)
- ⚠️ JSDoc coverage incomplete (~40% complete) - will be completed in Phase 3
- ⚠️ TypeDoc generation has minor warnings - being addressed
- ⚠️ No v1 performance baseline - cannot quantify performance claims

### Low Priority (P3)
- ⚠️ Some error messages could be more descriptive
- ⚠️ Migration guide examples need expansion

### By Design (Not Bugs)
- Deprecation warnings in alpha - these are intentional to guide migration
- Breaking changes from v1 - documented in MIGRATION_GUIDE_V2.md
- No backward compatibility layer yet - will be added in beta

---

## How to Report Issues

### Before Reporting
1. ✅ Check [Known Issues](#known-issues) above
2. ✅ Search existing issues: https://github.com/maxali/fej/issues
3. ✅ Try to reproduce in minimal example
4. ✅ Note your environment (Node version, OS, etc.)

### Issue Template

```markdown
## Bug Report

**Environment:**
- fej version: 2.0.0-alpha.0
- Node version: 20.x
- OS: macOS/Windows/Linux
- Package manager: npm/pnpm/yarn

**Description:**
Brief description of the issue

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
What you expected to happen

**Actual Behavior:**
What actually happened

**Code Example:**
```javascript
// Minimal reproducible example
```

**Error Message:**
```
Full error message/stack trace
```

**Additional Context:**
Any other relevant information
```

### Priority Guidelines

**P0 (Critical)** - Report immediately
- Data loss
- Security issues
- Complete feature breakage
- Crashes

**P1 (High)** - Report within 24h
- Major functionality broken
- Incorrect behavior with no workaround
- Severe performance issues

**P2 (Medium)** - Report within this week
- Minor functionality issues
- Workarounds available
- Documentation gaps

**P3 (Low)** - Report anytime
- Cosmetic issues
- Nice-to-have improvements
- Enhancement suggestions

---

## Feedback Channels

### 1. GitHub Issues (For Bugs)
- URL: https://github.com/maxali/fej/issues
- Use label: `alpha-feedback`
- Response time: 24-48 hours for P0/P1

### 2. GitHub Discussions (For Feedback)
- URL: https://github.com/maxali/fej/discussions
- Category: "v2 Alpha Feedback"
- Use for:
  - API design feedback
  - Feature requests
  - Documentation feedback
  - Migration experience

### 3. Weekly Check-Ins
- **Format**: GitHub Discussion thread
- **Schedule**: Every Monday (4 weeks total)
- **Topics**:
  - What worked well
  - What didn't work
  - Blockers
  - Questions

### 4. Direct Communication (Emergency Only)
- For critical P0 issues only
- Create GitHub issue first, then ping in discussion

---

## Timeline & Expectations

### Alpha Phase Timeline (4 weeks)

```
Week 1: Installation & Core Features
├─ Install alpha version
├─ Test basic requests
├─ Test middleware basics
└─ Report initial feedback

Week 2: Advanced Features
├─ Error handling & retry
├─ AbortController integration
├─ Built-in utilities
└─ Report findings

Week 3: Real-World Integration
├─ Integrate into your project
├─ Test authentication flows
├─ Test edge cases
└─ Report integration experience

Week 4: Final Feedback & Documentation
├─ Complete testing checklist
├─ Review documentation
├─ Provide comprehensive feedback
└─ Help shape beta release
```

### After Alpha
- **Feedback Review**: 1 week
- **Alpha Fixes**: Addressed before beta
- **Beta Release**: Public testing (1 month)
- **RC Release**: Feature freeze (2 weeks)
- **Stable Release**: v2.0.0 🚀

### Response Time Commitment
- **P0 issues**: 24 hours
- **P1 issues**: 48 hours
- **P2/P3 issues**: 1 week
- **Feedback & questions**: 48-72 hours
- **Weekly check-in**: Every Monday

---

## Success Criteria

For alpha to be successful, we need:

### Technical Goals
- ✅ Zero P0/P1 bugs by end of alpha
- ✅ All core features tested in real projects
- ✅ Migration guide validated by alpha testers
- ✅ API design validated (no major breaking change requests)

### Feedback Goals
- ✅ At least 5 testers complete full checklist
- ✅ At least 3 testers integrate into real projects
- ✅ At least 10 issues/feedback items reported
- ✅ At least 5 documentation improvements suggested

### Community Goals
- ✅ Active participation in weekly check-ins
- ✅ Constructive feedback and suggestions
- ✅ Help other alpha testers in discussions

---

## Tips for Effective Alpha Testing

### 1. Start Small
- Don't migrate your entire app on day 1
- Start with a single feature or module
- Gradually expand usage

### 2. Keep Notes
- Document your migration experience
- Note pain points and "aha!" moments
- Share in discussions

### 3. Test Edge Cases
- Don't just test happy paths
- Try error scenarios
- Test performance with many requests
- Test concurrent operations

### 4. Compare with v1
- Note API differences
- Identify migration challenges
- Suggest improvements

### 5. Think About Others
- How would a new user experience this?
- Is the API intuitive?
- Are error messages helpful?

---

## FAQ

### Q: Can I use alpha in production?
**A:** No, absolutely not. Alpha is for testing only. Use v1.x for production.

### Q: Will alpha versions be deleted from npm?
**A:** No, but they won't be maintained. Always upgrade to stable when available.

### Q: Can I share alpha feedback publicly?
**A:** Yes! Share on social media, blog posts, etc. Help spread the word.

### Q: What if I find a migration blocker?
**A:** Report immediately as P0. We'll prioritize fixing migration blockers.

### Q: Can I invite others to alpha test?
**A:** Yes, but ask them to follow this guide and participate actively.

### Q: How do I stay updated on alpha releases?
**A:** Watch the GitHub repo and join discussions. We'll announce updates there.

---

## Thank You! 🙏

Your participation in alpha testing is invaluable. Every bug report, suggestion, and piece of feedback helps make fej v2 better for everyone.

**Let's build something great together!**

---

## Resources

- **Migration Guide**: [MIGRATION_GUIDE_V2.md](./MIGRATION_GUIDE_V2.md)
- **API Documentation**: [docs/](./docs/)
- **Feature Guides**:
  - [Middleware Management](./docs/MIDDLEWARE_MANAGEMENT.md)
  - [Error Handling & Retry](./docs/ERROR_HANDLING_RETRY.md)
  - [AbortController Integration](./docs/ABORT_CONTROLLER.md)
  - [Middleware Utilities](./docs/MIDDLEWARE_UTILITIES.md)
- **GitHub**: https://github.com/maxali/fej
- **npm**: https://www.npmjs.com/package/fej

---

**Last Updated**: 2025-10-17
**Alpha Version**: 2.0.0-alpha.0
**Guide Version**: 1.0.0
