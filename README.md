# fej
Fetch API with middleware

fej exposes simple middleware API to manipulate request properties.

You can override middleware and initial data with each request: `fej("/api/users", { headers: {"Accept": "application/xml"} })`

## 📋 Project Status

**Current Version:** 1.0.5  
**Status:** Stable, with v2 in planning  
**Next Major Version:** v2.0.0 (See [V2_PLAN.md](./V2_PLAN.md))

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
  import Fej from "fej";

  Fej.setInit({
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  });
```

## Fej.addAsyncMiddleware
Updating `fetch` properties asynchronously
```javascript
  import Fej from "fej";

  Fej.addAsyncMiddleware(async init => {

    // get access token
    const token = await authService.acquireTokenSilent();

    // update Authorization header with new access token
    return Promise.resolve({
      headers: { Authorization: "Bearer " + token.accessToken }
    });
  });
```


## Fej.addMiddleware
```javascript
  import Fej from "fej";

  Fej.addMiddleware(init => {

    // Get current time
    const currentDateTime = new Date().toISOString()

    // update Authorization header with new access token
    return {
      headers: { "Z-CURRENTTIME": currentDateTime }
    };
  });
```

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

