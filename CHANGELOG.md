# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0-rc.0] - 2025-12-26 (Release Candidate)

### Release Candidate Status

This is the **Release Candidate** for v2.0.0. Feature freeze is in effect - only bug fixes will be included from this point forward. The stable release is planned for January 9, 2026.

### Changes from Beta

- ✅ All beta feedback addressed
- ✅ Bundle size verified and optimized (13.14KB minified, 4.36KB gzipped)
- ✅ Documentation finalized and reviewed
- ✅ Zero P0/P1 bugs
- ✅ Comprehensive testing across Node 18/20/22 and modern browsers

### What's Ready

- ✅ **Named Middleware** - Organize and manage middleware with names and priorities
- ✅ **Instance-Based Configuration** - Create multiple independent instances
- ✅ **Unified API** - Single `use()` method for all middleware
- ✅ **Error Handling & Retry** - Built-in retry logic and error middleware
- ✅ **AbortController Integration** - Request cancellation support
- ✅ **Built-in Utilities** - Bearer token, logger, retry middleware
- ✅ **Modern Tooling** - TypeScript 5.x strict mode, Vitest, ESLint
- ✅ **Zero Dependencies** - Still no production dependencies

### Next Steps

- Release Candidate testing period: 2 weeks
- Stable release: v2.0.0 (January 9, 2026)

See [RC_RELEASE_NOTES.md](./RC_RELEASE_NOTES.md) for complete details.

---

## [2.0.0-beta.0] - 2025-11-21 (Public Beta)

### Beta Release

Public beta testing with 50-100 community testers. All alpha feedback has been integrated.

See [BETA_RELEASE_NOTES.md](./BETA_RELEASE_NOTES.md) for complete details.

---

### Planned for v2.0.0

See [V2_PLAN.md](./V2_PLAN.md) for the complete v2 roadmap.

---

## [1.0.5] - Current Release

### Features

- Simple middleware API for fetch requests
- Global request initialization with `setInit()`
- Synchronous middleware support via `addMiddleware()`
- Asynchronous middleware support via `addAsyncMiddleware()`
- Deep merge strategy for combining request options
- TypeScript support with full type definitions
- Zero runtime dependencies

### Known Issues

- Async middleware execution bug (awaits array instead of results)
- `addMiddleware` incorrectly declared as async
- Limited test coverage
- Outdated dependencies
- TypeScript compatibility issues with modern packages

---

## [1.0.4] - Previous Releases

### Changed

- Documentation improvements
- Type definition updates

---

## [1.0.3]

### Fixed

- Minor bug fixes
- Type improvements

---

## [1.0.2]

### Changed

- Package metadata updates

---

## [1.0.1]

### Fixed

- Build configuration fixes

---

## [1.0.0] - Initial Release

### Added

- Initial implementation of fej
- Middleware pattern for fetch API
- Basic TypeScript support
- Documentation and examples

---

## Upcoming Changes

### v2.0.0 (In Planning)

#### Breaking Changes

- Minimum Node.js version: 18+
- Minimum TypeScript version: 5.0+
- API changes for better consistency
- Module system: Dual ESM/CommonJS support

#### Added

- Named middleware with management
- Request/response interceptors
- Error middleware
- Retry mechanism
- Timeout handling
- AbortController integration
- Request deduplication
- Simple caching layer
- Middleware utilities library
- Performance monitoring hooks
- Debug mode
- Better error messages

#### Fixed

- Async middleware execution bug
- Remove async from addMiddleware
- Deep merge edge cases
- Type safety issues

#### Changed

- Upgraded to TypeScript 5.x
- Replaced TSLint with ESLint
- Modernized build pipeline
- Comprehensive test suite (80%+ coverage)
- Complete API documentation
- Migration guide from v1

#### Removed

- Support for Node.js < 18
- Support for TypeScript < 5.0

---

## Migration Guides

### v1.x to v2.0

See [V2_IMPLEMENTATION_GUIDE.md](./V2_IMPLEMENTATION_GUIDE.md) for detailed migration instructions.

Key changes:

1. Constructor-based configuration instead of `setInit()`
2. Unified `use()` method instead of separate `addMiddleware()` and `addAsyncMiddleware()`
3. Enhanced request/response types
4. New interceptor API
5. Plugin system for extended functionality

---

## Development

### How to Contribute

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

### Release Process

1. Update version in package.json
2. Update this CHANGELOG.md
3. Create git tag
4. Publish to npm
5. Create GitHub release
6. Announce release

---

## Links

- [Homepage](https://github.com/maxali/fej)
- [Issue Tracker](https://github.com/maxali/fej/issues)
- [NPM Package](https://www.npmjs.com/package/fej)
- [Documentation](https://github.com/maxali/fej#readme)

---

## Legend

- `Added` - New features
- `Changed` - Changes in existing functionality
- `Deprecated` - Soon-to-be removed features
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Security vulnerability fixes
