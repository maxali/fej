# fej

Fetch API with middleware

> **🎉 v2.0 Release Candidate!** Feature freeze in effect - [RC Release Notes](./RC_RELEASE_NOTES.md) | [Migration Guide](./MIGRATION_GUIDE_V2.md) | [Try RC](#rc-testing)

fej exposes simple middleware API to manipulate request properties.

You can override middleware and initial data with each request: `fej("/api/users", { headers: {"Accept": "application/xml"} })`

## 📋 Project Status

**Latest Stable:** v1.0.6 (production ready)
**Release Candidate:** v2.0.0-rc.0 (final testing) - `npm install fej@rc`
**Status:** v2.0 RC testing (2 weeks) - Feature freeze in effect
**Beta Complete:** ✅ All feedback addressed, zero P0/P1 bugs
**Stable Release:** January 9, 2026 (2 weeks)

### 🎯 v2.0 Release Candidate Highlights

- ✅ **Feature complete** - No new features, bug fixes only
- ✅ **Named middleware** with priority ordering - proven in alpha/beta
- ✅ **Instance-based configuration** (multiple independent instances)
- ✅ **Unified API** - One `use()` method replaces separate sync/async middleware
- ✅ **Error handling & retry** - Built-in retry logic and error middleware
- ✅ **AbortController integration** - Request cancellation validated
- ✅ **Built-in utilities** - Bearer token, logger, retry middleware
- ✅ **Modern tooling** - TypeScript 5.x strict mode, Vitest, ESLint
- ✅ **Zero dependencies** and optimized bundle size (13.14 KB minified, 4.36 KB gzipped)
- ✅ **Battle-tested** - Alpha (12 testers) + Beta (community testing)

📖 **RC Testing:**
- **[RC Release Notes](./RC_RELEASE_NOTES.md)** - What's in the release candidate
- **[Migration Guide](./MIGRATION_GUIDE_V2.md)** - v1 to v2 migration with examples
- **[Try RC Now](#rc-testing)** - Help us validate the final release!
- **[Beta Results](./PHASE_4.2_COMPLETION_SUMMARY.md)** - What we accomplished

🎯 **RC is production-ready - final community validation before stable release on January 9, 2026.**

## 📚 Documentation

- **[Project Review](./PROJECT_REVIEW.md)** - Comprehensive analysis of the current state
- **[V2 Plan](./V2_PLAN.md)** - Detailed roadmap for version 2.0
- **[Implementation Guide](./V2_IMPLEMENTATION_GUIDE.md)** - Technical specifications for v2
- **[Contributing](./CONTRIBUTING.md)** - How to contribute to the project
- **[Roadmap](./ROADMAP.md)** - Long-term vision and timeline
- **[Changelog](./CHANGELOG.md)** - Version history and changes

# Install

```bash
  npm install fej
```

# Usage

See following usage examples

## Fej.setInit

Set some static headers

```javascript
import Fej from 'fej';

Fej.setInit({
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});
```

## Fej.addAsyncMiddleware

Updating `fetch` properties asynchronously

```javascript
import Fej from 'fej';

Fej.addAsyncMiddleware(async (init) => {
  // get access token
  const token = await authService.acquireTokenSilent();

  // update Authorization header with new access token
  return Promise.resolve({
    headers: { Authorization: 'Bearer ' + token.accessToken },
  });
});
```

## Fej.addMiddleware

```javascript
import Fej from 'fej';

Fej.addMiddleware((init) => {
  // Get current time
  const currentDateTime = new Date().toISOString();

  // update Authorization header with new access token
  return {
    headers: { 'Z-CURRENTTIME': currentDateTime },
  };
});
```

---

## 🎯 RC Testing

**v2.0-rc.0 is now available for final community validation!**

**FEATURE FREEZE IN EFFECT** - Only bug fixes will be included from this point forward.

### How to Install RC

```bash
# Install RC version
npm install fej@rc

# Or specify exact version
npm install fej@2.0.0-rc.0
```

### Journey to RC

**Alpha Phase (October-November 2025):**
- ✅ 12 selected testers, 75% completion rate
- ✅ 3 real projects migrated (avg. 2.5 hours)
- ✅ 47 feedback items, 36 resolved (77%)
- ✅ 6 bugs fixed (3 P0/P1 critical)

**Beta Phase (November-December 2025):**
- ✅ Public community testing
- ✅ All feedback addressed
- ✅ Zero P0/P1 bugs remaining
- ✅ Bundle size verified and optimized

**RC Phase (December 2025 - January 2026):**
- 🎯 Final validation (2 weeks)
- 🎯 Bug fixes only, no new features
- 🎯 Production-ready testing
- 🎯 Stable release: January 9, 2026

### RC Testing Goals

We're looking for:
- **Final community validation** before stable release
- **Production testing** (RC is production-ready)
- **Bug reports**: Any critical issues found
- **Success stories**: Share your experience

### How to Participate

1. **Install RC**: `npm install fej@rc`
2. **Read documentation**: Check [RC Release Notes](./RC_RELEASE_NOTES.md)
3. **Test in production-like environment**
4. **Report bugs**: Use [GitHub Issues](https://github.com/maxali/fej/issues) with `v2-rc` label
5. **Share success**: Join [GitHub Discussions](https://github.com/maxali/fej/discussions)

### RC Testing Checklist

- [ ] Install RC and verify installation
- [ ] Test all critical features in your app
- [ ] Validate production performance
- [ ] Test migration from v1 (if applicable)
- [ ] Verify bundle size meets your needs
- [ ] Report any bugs or issues
- [ ] Share your success story

### What to Test

**Priority 1 (Critical):**
- Core request methods (GET, POST, PUT, DELETE, PATCH)
- Middleware execution and priority
- Error handling and retry logic
- Production performance

**Priority 2 (Important):**
- AbortController and request cancellation
- Multiple instances
- TypeScript types and inference
- Built-in middleware utilities

**Priority 3 (Nice to have):**
- Bundle size optimization
- Performance benchmarks
- Edge cases and corner scenarios

### RC Timeline

- **RC Release**: December 26, 2025 (Week 10)
- **RC Duration**: 2 weeks
- **Stable Release**: January 9, 2026 (Week 12)
- **v1 LTS Start**: January 9, 2026

### Support During RC

- **GitHub Issues**: Report bugs with `v2-rc` label
- **GitHub Discussions**: Ask questions in "v2 RC" category
- **Response Time**:
  - P0 (Critical): 24 hours
  - P1 (High): 48 hours
  - P2/P3 (Medium/Low): 72 hours

### Success Criteria for Stable Release

- [ ] Zero P0/P1 bugs found during RC
- [ ] 10+ production apps using RC successfully
- [ ] Performance validated in real-world scenarios
- [x] ✅ Bundle size < 15KB (verified: 13.14KB)
- [x] ✅ Migration guide tested
- [x] ✅ Documentation complete

---

## 🚀 What's Coming in v2.0

fej v2 will bring major improvements while maintaining its core simplicity:

### Key Features

- ✅ **Fixed Critical Bugs** - Async middleware execution and more
- ✅ **Modern Tooling** - TypeScript 5.x, ESLint, Vitest
- ✅ **Enhanced Testing** - 80%+ code coverage
- ✅ **Better DX** - Improved types, error messages, and debugging
- ✅ **New Features** - Interceptors, retry, timeout, request cancellation
- ✅ **Plugin System** - Extensible middleware utilities
- ✅ **Comprehensive Docs** - API reference, guides, and examples

### Breaking Changes

- Node.js 18+ required (native fetch support)
- TypeScript 5.0+ for TypeScript users
- Refined API (with v1 compatibility layer)

See the full [V2 Plan](./V2_PLAN.md) for details.

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
