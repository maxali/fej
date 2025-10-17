# Fej Roadmap

This document outlines the development roadmap for the fej project. For detailed technical specifications, see [V2_PLAN.md](./V2_PLAN.md).

---

## Vision

Transform fej into the simplest, most elegant middleware framework for HTTP requests while maintaining zero runtime dependencies and a minimal footprint.

---

## Current Status (v1.0.5)

**Status**: Functional prototype with critical issues  
**Focus**: Basic middleware pattern for fetch API

### What Works ✅

- Simple middleware registration
- Async middleware support
- Global request configuration
- TypeScript definitions
- Zero dependencies

### What Needs Fixing ❌

- Critical bug in async middleware execution
- Outdated tooling and dependencies
- Minimal test coverage
- Limited features compared to competitors
- Poor documentation

---

## Version 2.0 - Foundation (Q1 2024)

**Goal**: Production-ready release with critical fixes and modern tooling

### Phase 1: Bug Fixes & Modernization (Weeks 1-3)

**Status**: 🟡 Planning

#### Critical Fixes

- [ ] Fix async middleware execution logic
- [ ] Remove incorrect async from addMiddleware
- [ ] Fix deep merge edge cases
- [ ] Add proper error boundaries

#### Tooling Updates

- [ ] Upgrade TypeScript to 5.x
- [ ] Replace TSLint with ESLint
- [ ] Add Prettier for formatting
- [ ] Configure modern build system (tsup)
- [ ] Set up GitHub Actions CI/CD

#### Testing

- [ ] Set up Vitest test framework
- [ ] Add test coverage reporting
- [ ] Write comprehensive unit tests
- [ ] Add integration tests
- [ ] Target: 80%+ coverage

### Phase 2: Core Features (Weeks 4-7)

**Status**: 🟡 Planning

#### Middleware Management

- [ ] Named middleware
- [ ] Middleware removal (`removeMiddleware`)
- [ ] Priority/ordering system
- [ ] Conditional middleware (path/method filters)

#### Error Handling

- [ ] Error middleware support
- [ ] Better error messages
- [ ] Error transformation
- [ ] Retry mechanism

#### Request/Response Features

- [ ] Pre-request hooks
- [ ] Post-response hooks
- [ ] Request/response transformation
- [ ] AbortController integration

### Phase 3: Documentation & Community (Weeks 8-10)

**Status**: 🟡 Planning

#### Documentation

- [ ] Complete API reference
- [ ] Migration guide from v1
- [ ] Recipe book
- [ ] TypeScript guide
- [ ] Troubleshooting guide

#### Community

- [ ] CONTRIBUTING.md
- [ ] CODE_OF_CONDUCT.md
- [ ] Issue templates
- [ ] PR templates
- [ ] GitHub Discussions setup

#### Examples

- [ ] Authentication patterns
- [ ] Framework integrations
- [ ] Testing strategies
- [ ] Real-world use cases

### Phase 4: Release (Weeks 11-12)

**Status**: 🟡 Planning

- [ ] Security audit
- [ ] Performance optimization
- [ ] Browser compatibility testing
- [ ] Final documentation review
- [ ] npm publish
- [ ] Announcement and marketing

**Target Release**: Q1 2024  
**Breaking Changes**: Yes (see migration guide)

---

## Version 2.1 - Enhancement (Q2 2024)

**Goal**: Advanced features and ecosystem growth

### Planned Features

- [ ] Request deduplication
- [ ] Simple caching layer
- [ ] Cache invalidation strategies
- [ ] Performance monitoring API
- [ ] Request/response logging
- [ ] Debug mode improvements

### Plugin System

- [ ] Official retry plugin
- [ ] Cache plugin
- [ ] Logger plugin
- [ ] Timeout plugin
- [ ] Mock/test plugin

### Framework Integrations

- [ ] React hooks package
- [ ] Vue composables package
- [ ] Svelte stores package
- [ ] Angular service

**Target Release**: Q2 2024  
**Breaking Changes**: No

---

## Version 2.2 - Ecosystem (Q3 2024)

**Goal**: Build a thriving ecosystem

### Developer Tools

- [ ] VS Code extension/snippets
- [ ] Chrome DevTools integration
- [ ] CLI for testing middleware
- [ ] Online playground

### Enhanced Documentation

- [ ] Interactive examples
- [ ] Video tutorials
- [ ] Case studies
- [ ] Performance benchmarks

### Community Features

- [ ] Plugin registry
- [ ] Community plugins showcase
- [ ] Discord server
- [ ] Monthly newsletter

**Target Release**: Q3 2024  
**Breaking Changes**: No

---

## Version 2.3 - Specialization (Q4 2024)

**Goal**: Support for specialized use cases

### Planned Features

- [ ] GraphQL support
- [ ] WebSocket middleware
- [ ] Server-Sent Events (SSE)
- [ ] Service Worker integration
- [ ] React Native optimizations
- [ ] Deno support
- [ ] Bun support

### Advanced Plugins

- [ ] Circuit breaker
- [ ] Rate limiting
- [ ] Request batching
- [ ] Response streaming
- [ ] Compression support

**Target Release**: Q4 2024  
**Breaking Changes**: No

---

## Version 3.0 - Evolution (2025+)

**Goal**: Next generation features (Long-term vision)

### Potential Features

- HTTP/3 support
- Built-in authentication flows (OAuth, JWT, etc.)
- Advanced caching strategies
- Request/response schema validation
- OpenAPI/Swagger integration
- Automatic API client generation
- Built-in mocking for testing
- Request recording/replay
- A/B testing support

### Architectural Considerations

- Possible rewrite in modern JavaScript
- Consider Web Standards alignment
- Evaluate emerging fetch alternatives
- Plugin architecture v2
- Performance optimizations

**Target Release**: TBD  
**Breaking Changes**: Yes (major version)

---

## Feature Requests

### High Priority

1. Middleware removal/management (2.0)
2. Error handling improvements (2.0)
3. Retry mechanism (2.0)
4. Better TypeScript support (2.0)
5. Request interceptors (2.0)

### Medium Priority

1. Caching layer (2.1)
2. Request deduplication (2.1)
3. Performance monitoring (2.1)
4. React hooks (2.2)
5. GraphQL support (2.3)

### Low Priority / Future

1. OAuth flows (3.0)
2. Schema validation (3.0)
3. OpenAPI integration (3.0)
4. HTTP/3 support (3.0)

---

## Success Metrics

### v2.0 Goals

- [ ] 80%+ test coverage
- [ ] <5KB bundle size (minified)
- [ ] 100% TypeScript strict mode
- [ ] Zero critical bugs
- [ ] 1000+ npm downloads/week
- [ ] 500+ GitHub stars

### v2.1+ Goals

- [ ] 90%+ test coverage
- [ ] 5000+ npm downloads/week
- [ ] 1000+ GitHub stars
- [ ] 10+ active contributors
- [ ] 5+ official plugins

### v3.0+ Goals

- [ ] 10,000+ npm downloads/week
- [ ] 2000+ GitHub stars
- [ ] 25+ active contributors
- [ ] Thriving plugin ecosystem
- [ ] Industry recognition

---

## Non-Goals

Things we explicitly **won't** do:

### Keep It Simple

- ❌ Won't add every feature from axios/ky
- ❌ Won't add runtime dependencies
- ❌ Won't support legacy browsers without polyfills
- ❌ Won't become a full HTTP client (use axios for that)

### Stay Focused

- ❌ Won't add unrelated utilities
- ❌ Won't add UI components
- ❌ Won't add state management
- ❌ Won't replace frameworks

### Maintain Quality

- ❌ Won't sacrifice type safety for convenience
- ❌ Won't skip tests for speed
- ❌ Won't ignore security issues
- ❌ Won't break APIs without migration path

---

## How to Influence the Roadmap

### Suggest Features

1. Open a GitHub Discussion for ideas
2. Upvote existing feature requests
3. Provide use cases and rationale
4. Offer to help implement

### Report Issues

1. Check existing issues first
2. Provide clear reproduction steps
3. Include version information
4. Be patient and respectful

### Contribute

1. Review [CONTRIBUTING.md](./CONTRIBUTING.md)
2. Start with "good first issue" labels
3. Discuss large changes first
4. Write tests and documentation

---

## Timeline Overview

```
2024 Q1: v2.0 - Foundation ████████░░░░░░░░
2024 Q2: v2.1 - Enhancement ░░░░░░░░████░░░░
2024 Q3: v2.2 - Ecosystem ░░░░░░░░░░░░████░░
2024 Q4: v2.3 - Specialization ░░░░░░░░░░░░░░████
2025+:   v3.0 - Evolution ░░░░░░░░░░░░░░░░░░░░
```

**Note**: Timeline is approximate and subject to change based on community contributions and priorities.

---

## Get Involved

### Stay Updated

- ⭐ Star the repo on GitHub
- 👀 Watch releases
- 💬 Join GitHub Discussions
- 🐦 Follow on Twitter (if available)

### Contribute

- 🐛 Report bugs
- 💡 Suggest features
- 📝 Improve documentation
- 🔧 Submit pull requests
- 💬 Help others in Discussions

### Support

- 📢 Share the project
- ✍️ Write blog posts
- 🎥 Create tutorials
- ⭐ Leave a review

---

## Questions?

- **General**: GitHub Discussions
- **Bugs**: GitHub Issues
- **Security**: Email maintainers
- **Other**: Open an issue

---

## Maintainers

This roadmap is maintained by:

- @maxali (Creator)
- [Contributors welcome!]

Last updated: 2024-10 (v2 Planning)
