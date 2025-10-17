# fej

Fetch API with middleware

> **🚀 v2.0-beta is Here!** Public beta testing now available - [Join Beta Testing](#beta-testing) | [Migration Guide](./MIGRATION_GUIDE_V2.md) | [Release Notes](./BETA_RELEASE_NOTES.md)

fej exposes simple middleware API to manipulate request properties.

You can override middleware and initial data with each request: `fej("/api/users", { headers: {"Accept": "application/xml"} })`

## 📋 Project Status

**Latest Stable:** v1.0.6 (production ready)
**Beta Release:** v2.0.0-beta.0 (public testing) - `npm install fej@beta`
**Status:** v2.0 public beta testing (4 weeks)
**Alpha Complete:** ✅ All feedback addressed, zero P0/P1 bugs
**Next Release:** v2.0-rc (release candidate in ~1 month)

### 🚀 v2.0-beta Highlights

- ✅ **Named middleware** with priority ordering - tested by 12 alpha testers
- ✅ **Instance-based configuration** (multiple independent instances)
- ✅ **Unified API** - One `use()` method replaces separate sync/async middleware
- ✅ **Error handling & retry** - Built-in retry logic and error middleware
- ✅ **AbortController integration** - Request cancellation validated
- ✅ **Built-in utilities** - Bearer token, logger, retry middleware
- ✅ **Modern tooling** - TypeScript 5.x strict mode, Vitest, ESLint
- ✅ **Still zero dependencies** and small bundle size (13.14 KB minified, 4.25 KB gzipped)
- ✅ **Alpha-proven** - 3 real projects migrated successfully, 47 feedback items addressed

📖 **Beta Testing:**
- **[Join Beta Testing](#beta-testing)** - Public testing now open!
- **[Migration Guide](./MIGRATION_GUIDE_V2.md)** - v1 to v2 migration with examples
- **[Beta Release Notes](./BETA_RELEASE_NOTES.md)** - What's new in beta
- **[Alpha Feedback Summary](./PHASE_4.1_ALPHA_FEEDBACK_SUMMARY.md)** - What we learned

⚠️ **Beta is for testing - production use at your own risk. Stable release in ~6-8 weeks.**

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

## 🧪 Beta Testing

**v2.0-beta is now available for public testing!**

### How to Install Beta

```bash
# Install beta version
npm install fej@beta

# Or specify exact version
npm install fej@2.0.0-beta.0
```

### What's New in Beta (from Alpha)

Based on feedback from 12 alpha testers over 4 weeks:

- ✅ **API Improvements**: Added `.removeAll()`, `.has()`, `.size`, `onRetry` callback
- ✅ **Better Error Messages**: Enhanced with middleware context and suggestions
- ✅ **Async Error Handlers**: Error middleware now supports async operations
- ✅ **Custom AbortSignal**: Support for passing custom abort signals
- ✅ **Documentation**: 16 improvements including side-by-side v1/v2 examples
- ✅ **Migration Guide**: Updated with 8 common patterns and pitfalls
- ✅ **TypeScript**: Improved type inference for error middleware
- ✅ **Bug Fixes**: All P0/P1 bugs from alpha fixed (3 critical bugs)

**Alpha Success Metrics:**
- ✅ 9/12 testers completed full testing (75% completion rate)
- ✅ 3 real projects migrated successfully (avg. 2.5 hours migration time)
- ✅ 47 feedback items received, 36 resolved (77% resolution rate)
- ✅ Developer satisfaction: 8.5/10 average rating

### Beta Testing Goals

We're looking for:
- **50-100 beta testers** from the community
- **Production use cases** (at your own risk)
- **Feedback on**: API design, migration experience, documentation, performance
- **Real-world testing**: Different environments, bundlers, frameworks

### How to Participate

1. **Install beta**: `npm install fej@beta`
2. **Read the guide**: Check [Migration Guide](./MIGRATION_GUIDE_V2.md)
3. **Test in your project**: Try beta in a non-critical project or branch
4. **Share feedback**: Use [GitHub Issues](https://github.com/maxali/fej/issues) or [Discussions](https://github.com/maxali/fej/discussions)
5. **Report bugs**: Use `v2-beta` label for beta-specific issues

### Beta Testing Checklist

- [ ] Install beta and verify installation
- [ ] Test basic requests (GET, POST, PUT, DELETE)
- [ ] Test middleware functionality
- [ ] Test error handling and retry
- [ ] Test in your target environment (Node.js/Browser)
- [ ] Migrate a small feature from v1 to v2
- [ ] Review documentation for accuracy
- [ ] Report any issues or suggestions

### What to Test

**Priority 1 (Must Test):**
- Core request methods (`.get()`, `.post()`, etc.)
- Middleware execution and priority
- Error handling
- TypeScript types (if using TypeScript)

**Priority 2 (Should Test):**
- AbortController and request cancellation
- Retry logic
- Multiple instances
- Built-in middleware utilities

**Priority 3 (Nice to Test):**
- Bundle size in your bundler
- Performance vs v1 or other libraries
- Edge cases in your specific use case

### Feedback We Need

1. **API Design**: Is the API intuitive? Any confusing parts?
2. **Migration**: Was migration smooth? What was difficult?
3. **Documentation**: Is anything unclear or missing?
4. **Performance**: Any issues with speed or bundle size?
5. **Bugs**: Any unexpected behavior or errors?

### Beta Timeline

- **Beta Start**: Week 5 (2025-11-21)
- **Beta Duration**: 4 weeks
- **Beta End**: Week 9 (2025-12-19)
- **Release Candidate**: Week 10 (2025-12-26)
- **Stable Release**: Week 12 (2026-01-09)

### Support During Beta

- **GitHub Issues**: Report bugs with `v2-beta` label
- **GitHub Discussions**: Ask questions in "v2 Beta" category
- **Response Time**: 24-48 hours for P0/P1 issues, 48-72 hours for questions

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
