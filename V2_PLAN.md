# Fej v2.0 Development Plan

## Vision Statement

Transform **fej** from a simple fetch wrapper into a robust, production-ready middleware framework for HTTP requests while maintaining its core philosophy of simplicity and zero dependencies.

---

## Goals and Objectives

### Primary Goals

1. **Fix Critical Bugs**: Address all identified code issues
2. **Modernize Tooling**: Update to current best practices and tools
3. **Enhance Testing**: Achieve comprehensive test coverage with all public APIs tested
4. **Improve Developer Experience**: Better types, docs, and error messages
5. **Maintain Simplicity**: Keep the API clean and focused on essential features

### Success Criteria (SMART Goals)

- **Zero known P0/P1 bugs at launch**: No critical bugs in production
  - **P0 Definition**: Bugs that cause complete failure (crashes, data loss, security vulnerabilities)
  - **P1 Definition**: Bugs that break core functionality (middleware not executing, incorrect behavior)
  - **Measurement**: Manual triage of all open issues, bug tracker filtered by severity, zero P0/P1 issues at release
- **All public APIs tested**: Every exported function has unit tests with edge cases
  - **Specific**: Every function in public exports (`src/index.ts`) has corresponding test file
  - **Measurement**: 100% of public functions have at least 3 test cases (success, failure, edge case)
  - **Verification**: Automated check in CI that fails if public API lacks tests
- **TypeScript strict mode**: Passes TypeScript 5.x strict mode with zero errors
  - **Specific**: `strict: true` in tsconfig.json with all strict flags enabled
  - **Measurement**: `tsc --noEmit` exits with code 0 (zero type errors)
  - **Verification**: CI runs type check on every PR, blocks merge if errors exist
- **ESM and CommonJS dual package**: Both module systems supported
  - **Specific**: package.json exports both `.mjs` (ESM) and `.cjs` (CommonJS) builds
  - **Measurement**: Manual verification that `import` and `require()` both work in Node.js 18+
  - **Verification**: Integration tests run in both ESM and CJS environments
- **100% API documentation**: All public APIs documented with JSDoc and examples
  - **Specific**: Every exported function, class, interface has JSDoc comment with description, @param, @returns, @example
  - **Measurement**: TypeDoc generates docs without warnings, manual review confirms all APIs documented
  - **Verification**: CI fails if TypeDoc emits warnings about missing documentation
- **CI runs on all PRs within 5 minutes**: Automated tests on every commit
  - **Specific**: GitHub Actions workflow completes all steps (lint, test, build, size check) in <5 minutes
  - **Measurement**: Track CI duration in GitHub Actions UI, p95 latency <5 minutes
  - **Action**: Optimize slow tests, run tests in parallel, cache dependencies
- **<10KB bundle size (minified)**: Realistic target with tree-shaking support (~6-8KB typical usage)
  - **Specific**: Full library <10KB minified+gzipped, typical usage <8KB, core only <5KB
  - **Measurement**: `size-limit` package runs automated checks against these targets
  - **Verification**: CI fails if any size limit exceeded, PR comments show size impact

### Scope Philosophy: MVP First

This v2.0 release focuses on **essential features only**. Advanced features are intentionally deferred to v2.1+ to ensure:

- High quality implementation
- Realistic timeline (6-8 months)
- Maintainable codebase
- True simplicity in API design

---

## Release Phases

### Phase 0: Preparation (v1.9 Deprecation Release)

**Timeline:** 3-4 weeks (increased from 2-3 weeks to account for comprehensive baseline measurement)
**Focus:** Baseline measurement and user preparation
**CRITICAL:** This phase must complete 2 months before v2.0-alpha release

**Why Baseline Measurements Matter:**
Without knowing v1's current performance, we cannot:

- Set realistic v2 targets (is <1ms overhead achievable?)
- Measure actual improvement (is v2 faster or slower than v1?)
- Identify current problems (where are the bottlenecks?)
- Make data-driven architectural decisions

#### 0.1 Baseline Performance Measurement (1 week)

**Purpose:** Establish quantitative baseline before any v2 development

**Benchmarking v1 Performance:**

- [ ] **Request overhead measurement:**
  - Measure time for request with 0 middleware (baseline)
  - Measure time for request with 1, 3, 5, 10 middleware
  - Calculate overhead per middleware: (total time - baseline) / middleware count
  - Run 1000 iterations per test for statistical significance
  - Document median, p95, p99 latencies
  - **Tool:** `benchmark.js` for precise measurements

- [ ] **Middleware execution profiling:**
  - Profile `addMiddleware()` execution time
  - Profile `addAsyncMiddleware()` execution time
  - Identify any performance bottlenecks in current implementation
  - Document call stack and execution flow
  - **Tool:** Node.js `--inspect` + Chrome DevTools Profiler

- [ ] **Memory usage profiling:**
  - Measure heap usage for single Fej instance (empty)
  - Measure heap usage with 10 middleware registered
  - Measure heap usage after 1000 sequential requests
  - Detect memory leaks: heap size should not grow after requests complete
  - Measure GC pressure (frequency and duration of garbage collection)
  - **Tool:** Node.js `--inspect`, Chrome DevTools Memory Profiler, `process.memoryUsage()`

- [ ] **Bundle size analysis:**
  - Measure minified size of v1
  - Measure minified + gzipped size
  - Analyze size breakdown by module (if applicable)
  - Identify largest contributors to bundle size
  - **Tool:** `webpack-bundle-analyzer` or `rollup-plugin-visualizer`

- [ ] **Load time measurement:**
  - Measure time to require/import fej in Node.js
  - Measure time to load fej in browser (via script tag)
  - Document any lazy-loading opportunities
  - **Tool:** `performance.now()` in Node.js and browser

**Create Comprehensive Benchmark Suite:**

- [ ] **Scenario 1: Zero middleware (baseline)**
  - Simple GET request with no middleware
  - Establishes baseline for fetch overhead
  - Target: <5ms total (network excluded)

- [ ] **Scenario 2: Single middleware**
  - One simple middleware (e.g., add header)
  - Measures per-middleware overhead
  - Target: <0.5ms overhead vs baseline

- [ ] **Scenario 3: Multiple middleware (5 middleware)**
  - Realistic scenario with auth, logging, headers, etc.
  - Target: <3ms overhead vs baseline

- [ ] **Scenario 4: Complex chain (10 middleware)**
  - Stress test with many middleware
  - Target: <5ms overhead vs baseline

- [ ] **Scenario 5: Error handling**
  - Middleware that throws error
  - Measures error handling overhead
  - Target: <2ms overhead vs baseline

- [ ] **Scenario 6: Concurrent requests**
  - 100 concurrent requests with 5 middleware each
  - Tests for race conditions and resource contention
  - Target: No memory leaks, similar overhead to sequential

**Document All Findings:**

- [ ] Create `BASELINE_METRICS.md` with all measurements
- [ ] Include graphs/charts where helpful (response time distribution, memory over time)
- [ ] Document test environment (Node version, OS, hardware specs)
- [ ] Identify any surprising results or bottlenecks
- [ ] Share findings with community for feedback

**Set Realistic v2 Targets Based on Data:**

- [ ] **Performance targets:**
  - v2 middleware overhead should be ≤ v1 overhead (no regression)
  - If v1 overhead is 0.8ms/middleware, target v2 at ≤1ms/middleware
  - If targets are unrealistic, adjust or document trade-offs

- [ ] **Bundle size targets:**
  - Baseline: v1 is ~3KB minified
  - v2 with 8-10 features: realistic target is 8-10KB minified
  - Set target: <10KB full library, <8KB typical usage with tree-shaking
  - Document size budget per feature (~0.8-1KB each)

- [ ] **Memory targets:**
  - v2 heap usage should be ≤ v1 + reasonable overhead for new features
  - If v1 uses 50KB heap, target v2 at <100KB heap per instance
  - No memory leaks over 1000 requests

**Time Estimate:** 25-35 hours (new, was missing from original plan)

**Deliverables:**

- `BASELINE_METRICS.md` with comprehensive v1 performance data
- Benchmark suite code (reusable for v2 comparison)
- Realistic v2 performance targets based on actual data
- Identification of any v1 bottlenecks to avoid in v2

#### 0.2 Bug Documentation (2 days)

- [ ] Document all known bugs with reproduction cases
- [ ] Prioritize bugs (P0, P1, P2, P3)
- [ ] Estimate fix time for each bug
- [ ] Identify which bugs will be fixed in v2 vs deferred

**Time Estimate:** 8-12 hours

#### 0.3 v1.9 Deprecation Release (User Warning Period)

**Purpose:** Give users 2 months advance warning before v2.0-alpha

- [ ] Add console.warn() for all deprecated patterns:
  - `Fej.setInit()` → Suggest `new Fej(config)` instead
  - `Fej.addMiddleware()` → Suggest `fej.use()` instead
  - `Fej.addAsyncMiddleware()` → Suggest `fej.use()` instead
  - Singleton usage → Suggest instance-based approach
- [ ] Create initial migration guide outline with:
  - List of all breaking changes
  - Side-by-side code comparisons (v1 vs v2)
  - Recommended migration steps
  - Timeline for v2 releases
- [ ] Announce v2 timeline prominently:
  - Blog post: "fej v2 is coming - prepare now"
  - GitHub Discussion: Pin announcement
  - README.md: Add "v2 Coming Soon" badge
  - npm package description: Note about v2
- [ ] Set up community support channels:
  - GitHub Discussions category for "v2 Migration"
  - Label system for v2-related issues
  - Migration FAQ document
- [ ] Gather user feedback on proposed changes:
  - Survey current users (5-10 minimum)
  - What features are essential?
  - What breaking changes are acceptable?
  - What migration support is needed?

#### 0.4 Migration Tooling Development

- [ ] Begin codemod development (automated migration script)
- [ ] Create migration testing repository with v1 examples
- [ ] Set up migration validation suite

**Time Estimate:** 20-25 hours

**Phase 0 Total Time Estimate:** 65-90 hours (increased from 40-50h to include comprehensive baseline measurement)

- Baseline Measurement: 25-35h (NEW - was completely missing)
- Bug Documentation: 8-12h (NEW - separated out)
- v1.9 Release + User Communication: 12-18h (reduced, was 40-50h)
- Migration Tooling: 20-25h (NEW - separated out)

**Success Criteria:**

- **Baseline metrics documented:** `BASELINE_METRICS.md` created with comprehensive v1 performance data
- **Benchmark suite created:** Reusable benchmark code for comparing v1 vs v2
- **Realistic targets set:** v2 performance targets adjusted based on actual v1 data (not guesses)
- **Bottlenecks identified:** Any v1 performance issues documented for avoidance in v2
- v1.9 released with deprecation warnings
- At least 50% of active users aware of v2 timeline (via GitHub stars, npm downloads analysis)
- Migration guide draft reviewed by 3-5 community members
- 2 month buffer before starting v2.0-alpha work

---

### Phase 1: Foundation (v2.0.0-alpha)

**Timeline:** 5-7 weeks
**Focus:** Critical fixes and modernization

#### 1.1 Bug Fixes (2 weeks)

- [ ] Fix async middleware execution logic (with comprehensive tests)
- [ ] Remove incorrect `async` from `addMiddleware`
- [ ] Fix deep merge edge cases (document expected behavior)
- [ ] Add proper error boundaries
- [ ] All fixes have regression tests

**Time Estimate:** 40-60 hours (realistic: doubled from original 20h estimate to account for comprehensive testing, edge cases, and unexpected complexity)

#### 1.2 Tooling Modernization (2 weeks)

- [ ] Upgrade TypeScript to 5.x (fix any errors)
- [ ] Replace TSLint with ESLint + modern config
- [ ] Add Prettier for code formatting
- [ ] Configure modern build pipeline (tsup or rollup)
- [ ] Add GitHub Actions CI/CD
- [ ] Set up automated npm publishing

**Time Estimate:** 40-60 hours (realistic: doubled from original 20h estimate due to configuration complexity, CI/CD setup, and troubleshooting)

#### 1.3 Testing Infrastructure (2 weeks)

- [ ] Set up Vitest test runner
- [ ] Add test coverage reporting
- [ ] Create test utilities and helpers
- [ ] Add integration tests with local HTTP server
- [ ] Set up browser compatibility tests (NOT e2e - libraries don't need e2e)
- [ ] CI integration for tests

**Time Estimate:** 50-70 hours (realistic: tripled from original 20h estimate due to comprehensive test setup, mock strategies, browser testing setup, and CI integration complexity)

#### 1.4 Type Safety (1 week)

- [ ] Enable TypeScript strict mode
- [ ] Remove all `any` types
- [ ] Add type tests (tsd or expect-type)
- [ ] Improve type inference where needed
- [ ] ~~Add runtime type validation~~ (REMOVED - conflicts with zero-dependency goal)

**Time Estimate:** 20-30 hours (realistic: increased 25% from original 20h estimate to account for fixing strict mode errors across entire codebase and improving complex generic types)

**Phase 1 Total:** 150-220 hours (5-7 weeks at 25-30h/week)

---

### Phase 2: Core Features (v2.0.0-beta)

**Timeline:** 6-8 weeks
**Focus:** Essential features only - SCOPE REDUCED BY 70%

#### 2.1 Middleware Management (2 weeks)

**ESSENTIAL - KEEP**

- [ ] Named middleware: `api.use('name', fn)`
- [ ] Middleware priority/ordering system
- [ ] Remove middleware by name or ID
- [ ] Middleware execution pipeline
- [ ] Comprehensive tests for all scenarios

**Time Estimate:** 50-70 hours (realistic: doubled from original 30h estimate due to complex execution pipeline, priority/ordering logic, edge cases, and comprehensive testing needs)

#### 2.2 Error Handling & Retry (2 weeks)

**ESSENTIAL - KEEP**

- [ ] Error middleware support
- [ ] Basic retry mechanism (attempts, delay, exponential backoff)
- [ ] Timeout handling with AbortController
- [ ] Error transformation hooks
- [ ] Comprehensive tests for error scenarios

**Time Estimate:** 50-70 hours (realistic: doubled from original 30h estimate due to complex retry logic with exponential backoff, timeout coordination with AbortController, and extensive error scenario testing)

#### 2.3 AbortController Integration (1 week)

**ESSENTIAL - KEEP**

- [ ] Request cancellation API
- [ ] Timeout with abort
- [ ] Cancel specific or all pending requests
- [ ] Tests for cancellation scenarios

**Time Estimate:** 30-40 hours (realistic: doubled from original 15h estimate due to proper signal propagation through middleware chain, race condition handling, and edge case testing)

#### 2.4 Essential Middleware Utilities (2 weeks)

**ESSENTIAL - KEEP (3 utilities only)**

- [ ] Bearer token middleware (authentication)
- [ ] Logger middleware (debugging)
- [ ] Basic retry middleware (resilience)
- [ ] Documentation and examples for each
- [ ] Tests for each utility

**Time Estimate:** 60-80 hours (realistic: tripled from original 20h estimate due to proper implementation of 3 utilities with comprehensive documentation, examples, and tests for each - approximately 20-25h per utility)

#### 2.5 Integration & Polish (1 week)

- [ ] Integration tests for all features working together
- [ ] Performance testing against baseline
- [ ] Bundle size validation and optimization
  - [ ] Set up `size-limit` package for automated size checks
  - [ ] Configure size budgets: <10KB full library, <8KB typical usage
  - [ ] Add CI check that fails if bundle size exceeds limits
  - [ ] Optimize any features exceeding per-feature budget (~1KB each)
- [ ] Type definitions review
- [ ] API documentation

**Time Estimate:** 30-40 hours (realistic: new addition to account for integration testing complexity and polish work not captured in individual feature estimates)

**Phase 2 Total:** 220-300 hours (6-8 weeks at 30h/week)

---

### Phase 2 - DEFERRED to v2.1+ (NOT in v2.0)

**These features are intentionally removed from v2.0 scope:**

❌ **Circuit breaker pattern** - Too complex, conflicts with zero-dependency goal
❌ **Request deduplication** - Complex implementation, not essential
❌ **Caching layer** - Needs LRU implementation or dependency, defer to plugin
❌ **Performance monitoring** - Nice-to-have, not essential for MVP
❌ **Middleware groups/categories** - Advanced feature, can add later
❌ **Request/Response interceptors as separate concept** - Confusing with middleware, use middleware only
❌ **Additional middleware utilities** (API key, timeout, CORS) - Can be added in v2.1+
❌ **Advanced error transformation** - Basic error handling is sufficient

---

### Phase 3: Documentation & Community (v2.0.0-rc)

**Timeline:** 4-5 weeks
**Focus:** Excellent documentation and basic examples only

#### 3.1 API Documentation (2 weeks)

- [ ] Complete API reference with JSDoc for all public APIs
- [ ] TypeScript usage guide
- [ ] Code examples for every API method
- [ ] Migration guide from v1 to v2 (detailed, before/after examples)
- [ ] Troubleshooting guide with common issues
- [ ] TypeDoc generation and hosting on GitHub Pages

**Time Estimate:** 80-100 hours (realistic: tripled from original 30h estimate - comprehensive documentation always takes longer than expected, requires multiple review passes, and examples need to be tested)

#### 3.2 Examples & Patterns (1 week)

- [ ] Basic usage examples
- [ ] Authentication patterns (Bearer token, API key)
- [ ] Error handling examples
- [ ] Testing strategies for apps using fej
- [ ] ONE framework integration: React hooks (most popular)

**Time Estimate:** 30-40 hours (realistic: tripled from original 15h estimate - React integration alone requires understanding hooks patterns, designing API, implementation, tests, and documentation - approximately 25-30h)

#### 3.3 Community Setup (1 week)

- [ ] CONTRIBUTING.md with detailed development setup
- [ ] CODE_OF_CONDUCT.md
- [ ] Issue templates (bug, feature request)
- [ ] PR templates with checklist
- [ ] First-time contributor guide
- [ ] Architecture decision records (ADRs) for key decisions

**Time Estimate:** 15-20 hours (realistic: tripled from original 5h estimate - quality community documentation requires careful thought, multiple iterations, and testing the contributor experience)

**Phase 3 Total:** 125-160 hours (4-5 weeks at 30h/week)

---

### Phase 3 - DEFERRED to v2.1+ (NOT in v2.0)

**These items are intentionally removed from v2.0 scope:**

❌ **Vue composables** - Community can contribute, focus on React first
❌ **Svelte stores** - Community can contribute
❌ **Node.js server examples** - Can add in v2.1
❌ **VS Code extension** - Nice-to-have, not essential
❌ **Chrome DevTools integration** - Complex, defer to later
❌ **CLI tools** - Not essential for library
❌ **Code generator** - Can add later if needed
❌ **Recipe book** - Start with basic examples, expand in v2.1

---

### Phase 4: Staged Release & Launch (v2.0.0)

**Timeline:** 10-14 weeks (includes all release stages with proper gaps)
**Focus:** Phased rollout with user feedback loops
**CRITICAL:** Follows the proven staged release pattern used by React, Vue, and other major libraries

#### 4.1 Alpha Release - Invite Only (4 weeks total: 2 weeks prep + 1 month testing)

**Purpose:** Early validation with selected users, catch major issues

**Preparation (2 weeks):**

- [ ] Complete all Phase 1-3 work
- [ ] Internal testing and validation
- [ ] Select 10-20 beta testers:
  - Mix of current v1 users
  - Different use cases (browser, Node.js, frameworks)
  - Active community members
- [ ] Prepare alpha documentation and known issues list
- [ ] Set up private feedback channel (Discord/Slack)

**Alpha Period (1 month):**

- [ ] Release v2.0.0-alpha to npm with `alpha` tag
- [ ] Announce in private channels only (invite-only)
- [ ] Weekly check-ins with alpha testers
- [ ] Gather detailed feedback:
  - API ergonomics and developer experience
  - Performance compared to v1
  - Migration pain points
  - Documentation clarity
  - Bug reports
- [ ] Fix critical issues (P0/P1 bugs)
- [ ] Iterate on API based on feedback
- [ ] Document all breaking changes discovered
- [ ] Update migration guide based on real migration experiences

**Time Estimate:** 25-35 hours (realistic: includes tester coordination, weekly syncs, issue triage, and fixes)

**Success Criteria:**

- All P0/P1 bugs fixed
- At least 3 alpha testers successfully migrated from v1
- API feedback incorporated
- No major architectural issues discovered

#### 4.2 Beta Release - Public (4 weeks total: 1 week prep + 1 month testing)

**Purpose:** Wider testing, gather community feedback, final API refinements

**Preparation (1 week):**

- [ ] Address all alpha feedback
- [ ] Update documentation with alpha learnings
- [ ] Prepare beta announcement materials
- [ ] Finalize migration guide with real examples from alpha

**Beta Period (1 month):**

- [ ] Release v2.0.0-beta to npm with `beta` tag (still not `latest`)
- [ ] Public announcement:
  - Blog post: "fej v2.0 beta is here"
  - GitHub Release with detailed notes
  - Social media (Twitter, Reddit, Dev.to)
  - Email to npm followers (if available)
- [ ] Actively solicit community feedback:
  - GitHub Discussions for Q&A
  - Weekly progress updates
  - Showcase early adopter success stories
- [ ] Performance optimization based on real-world usage
- [ ] Bundle size optimization and verification:
  - [ ] Analyze bundle composition with webpack-bundle-analyzer
  - [ ] Verify tree-shaking effectiveness
  - [ ] Ensure size-limit CI checks passing
  - [ ] Document final bundle sizes in README
- [ ] Security audit:
  - [ ] Self-audit using npm audit, Snyk
  - [ ] Community security review
  - [ ] Professional audit if budget allows
- [ ] Browser compatibility testing:
  - [ ] Chrome 120+ (2 latest versions)
  - [ ] Firefox 120+ (2 latest versions)
  - [ ] Safari 17+ (2 latest versions)
  - [ ] Edge 120+ (2 latest versions)
- [ ] Collect migration metrics:
  - How long does migration take?
  - What are common pain points?
  - Are docs sufficient?

**Time Estimate:** 35-45 hours (realistic: includes public beta management, broader feedback triage, optimization work, and cross-browser testing)

**Success Criteria:**

- At least 10 production apps using beta successfully
- All P1 bugs fixed (P0 should be zero from alpha)
- Performance targets met (<5ms overhead for 10 middleware)
- Bundle size within limits (<10KB full library)
- Positive community sentiment

#### 4.3 Release Candidate - Final Validation (2 weeks: 1 week prep + 2 weeks testing)

**Purpose:** Feature freeze, final bug fixes, production readiness validation

**Preparation (1 week):**

- [ ] Address all beta feedback
- [ ] Feature freeze - absolutely no new features
- [ ] Final documentation review and polish
- [ ] Prepare comprehensive release notes

**RC Period (2 weeks):**

- [ ] Release v2.0.0-rc to npm with `rc` tag
- [ ] Announce feature freeze and RC availability
- [ ] Bug fixes ONLY - no features, no API changes
- [ ] Final testing across all environments:
  - [ ] Node.js 18, 20, 22 (LTS versions)
  - [ ] Browser compatibility (all 4 browsers)
  - [ ] Framework integrations (React example)
  - [ ] Real production workloads
- [ ] Monitor RC adoption and stability
- [ ] Finalize migration guide:
  - [ ] All breaking changes documented
  - [ ] Before/after examples for every change
  - [ ] Troubleshooting section
  - [ ] FAQ from beta users
- [ ] Complete codemod tool (automated migration)
- [ ] Test codemod on real v1 projects

**Time Estimate:** 20-25 hours (realistic: feature freeze reduces workload, focus on validation and polish)

**Success Criteria:**

- Zero P0/P1 bugs
- At least 5 production apps on RC
- Codemod successfully migrates 3+ real projects
- Migration guide reviewed and approved by 3+ community members
- All documentation complete and accurate

#### 4.4 Stable Release & Launch (2 weeks)

**Purpose:** Official launch, marketing push, community celebration

**Preparation (1 week):**

- [ ] Final RC validation (no issues in last 2 weeks)
- [ ] Prepare all launch materials:
  - Comprehensive changelog
  - Detailed release notes with examples
  - Blog post/announcement article
  - Social media content
  - Video demo (optional but valuable)
  - Case studies from early adopters

**Launch (1 week):**

- [ ] Release v2.0.0 stable to npm
- [ ] Tag as `latest` on npm (major moment!)
- [ ] Update all documentation to default to v2
- [ ] GitHub Release with full notes and assets
- [ ] Launch announcement campaign:
  - [ ] Blog post (main website)
  - [ ] Dev.to article with detailed guide
  - [ ] Reddit announcement (r/javascript, r/webdev, r/node)
  - [ ] Twitter/X thread with highlights
  - [ ] Hacker News Show HN post
  - [ ] Product Hunt launch (optional)
  - [ ] Newsletter to npm followers
- [ ] Showcase early adopters:
  - [ ] Success stories section in docs
  - [ ] Tweet shout-outs to early adopters
  - [ ] Migration testimonials
- [ ] Community celebration:
  - [ ] Thank contributors publicly
  - [ ] Celebrate milestones in GitHub Discussion
  - [ ] Update project README with v2 badge

**Post-Launch Monitoring (ongoing):**

- [ ] Monitor npm download trends
- [ ] Track GitHub issues for v2-specific problems
- [ ] Respond quickly to critical issues (24-48h response time)
- [ ] Collect success stories and testimonials
- [ ] Plan v2.1 based on feedback

**Time Estimate:** 35-45 hours (realistic: launch marketing and coordination takes significant time)

**Success Criteria:**

- v2.0.0 released as `latest` on npm
- Zero critical bugs in first week
- Positive community reception (GitHub stars, social media)
- At least 20 production apps migrated
- Clear path to v2.1 features

---

### Phase 4 Summary

**Total Timeline:** 10-14 weeks (extended from original 4-6 weeks)

| Stage               | Duration               | Purpose              | Time Investment |
| ------------------- | ---------------------- | -------------------- | --------------- |
| Alpha (Invite Only) | 1 month + 2 weeks prep | Early validation     | 25-35h          |
| Beta (Public)       | 1 month + 1 week prep  | Community testing    | 35-45h          |
| RC (Final)          | 2 weeks + 1 week prep  | Production readiness | 20-25h          |
| Stable Launch       | 2 weeks                | Official release     | 35-45h          |
| **TOTAL**           | **10-14 weeks**        | **Phased rollout**   | **115-150h**    |

**Why This Takes Longer Than Original Plan:**

- Original plan: 4-6 weeks (95-130 hours)
- Revised plan: 10-14 weeks (115-150 hours)
- **Key Addition**: Proper gaps between stages for user feedback and iteration
- **Better Outcome**: Higher quality release, smoother user migration, less post-launch firefighting

**Phase 4 Total:** 115-150 hours (10-14 weeks with proper staging)

---

### Phase 5: v1.x Maintenance (Parallel timeline, 6-12 months)

**Focus:** Support v1 users during transition

- [ ] v1.9 released BEFORE v2.0-alpha (with deprecation warnings)
- [ ] Security patches for v1.x: 12 months
- [ ] Critical bug fixes for v1.x: 6 months
- [ ] No new features for v1.x
- [ ] Clear end-of-life (EOL) communication

---

## Technical Specifications

### Module System Support

```javascript
// ESM
import fej from 'fej';

// CommonJS
const fej = require('fej');

// CDN / Browser
<script src="https://unpkg.com/fej@2.0.0"></script>;
```

### Architecture Changes

#### Current (v1) - Simple but Limited

```
User → fej() → Sync MW → Async MW → fetch() → Response
```

**Problems:**

- Separate sync/async middleware (confusing)
- No response transformation
- Limited error handling

#### Proposed (v2) - Unified Middleware Model

**Simplified Architecture:**

```
User Request
    ↓
┌───────────────────────────────────────────────┐
│  Fej Instance (with configuration)            │
│  ┌─────────────────────────────────────────┐ │
│  │     Middleware Chain (Priority-Ordered)  │ │
│  │                                           │ │
│  │  MW1 → MW2 → MW3 → fetch() ← MW3 ← MW2 ← MW1 │
│  │   ↓     ↓     ↓      ↓       ↑     ↑     ↑ │
│  │  Pre-request Phase   |    Post-response   │ │
│  │  (Headers, Auth)     |    (Transform)     │ │
│  │                   Native                   │ │
│  │                   HTTP                     │ │
│  └─────────────────────────────────────────┘ │
│             Error Handling Layer              │
│  (Catch errors, retry logic, transform)       │
└───────────────────────────────────────────────┘
    ↓
User Response
```

**Key Design Decisions:**

1. **Single Middleware Concept** (not "middleware + interceptors + hooks")
   - One unified middleware model inspired by Koa
   - Middleware can handle both request and response phases
   - Uses `async/await` and `next()` for control flow

2. **Execution Flow** (Onion/Stack Model):

   ```typescript
   // Middleware executes in order, then backwards

   // MW1 - runs first (request phase)
   async (request, next) => {
     // Do request modifications
     request.headers.set('Auth', token);

     await next(); // Call next middleware

     // Do response modifications (runs after fetch)
     console.log('Response received');
     return request;
   };

   // MW2 - runs second
   async (request, next) => {
     const start = Date.now();
     await next();
     console.log(`Took ${Date.now() - start}ms`);
     return request;
   };

   // fetch() happens here

   // Then MW2 completes (logs time)
   // Then MW1 completes (logs response)
   ```

3. **No Separate "Interceptors"** (Removed Confusion)
   - Original plan had both "middleware" and "interceptors"
   - This was confusing - what's the difference?
   - **v2 Solution**: Everything is middleware
   - Middleware can handle request, response, and errors

4. **Error Handling via Middleware**:

   ```typescript
   // Error handling middleware
   api.use('error-handler', async (request, next) => {
     try {
       await next();
       return request;
     } catch (error) {
       if (shouldRetry(error)) {
         return retry(request);
       }
       throw error;
     }
   });
   ```

5. **Priority-Based Execution**:
   - Middleware can specify priority (higher = earlier)
   - Default priority: 0
   - Auth middleware: priority 100 (runs early)
   - Logger middleware: priority -100 (runs late)

**Why This Model?**

- **Simpler**: One concept instead of three (middleware/interceptors/hooks)
- **Proven**: Koa has used this model successfully for years
- **Flexible**: Can handle all use cases (auth, logging, retry, transform)
- **Predictable**: Clear execution order (priority-based, then registration order)
- **Easy to Learn**: Familiar pattern for Node.js developers

### API Evolution

#### Backward Compatible

```typescript
// v1 API - still works
import Fej from 'fej';
Fej.setInit({ headers: {...} });
Fej.addMiddleware(fn);
Fej.addAsyncMiddleware(asyncFn);
fej('/api/users');
```

#### New v2 API (Simplified - Middleware Only)

```typescript
import { createFej } from 'fej';

const api = createFej({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  retry: { attempts: 3, delay: 1000 },
  headers: { 'Content-Type': 'application/json' },
});

// Named middleware with priority
api.use(
  'auth',
  async (request, next) => {
    const token = await getToken();
    request.headers.set('Authorization', `Bearer ${token}`);
    await next();
    return request;
  },
  { priority: 100 }
);

// Logger middleware (runs after response)
api.use(
  'logger',
  async (request, next) => {
    console.log(`→ ${request.method} ${request.url}`);
    const start = Date.now();

    await next(); // Execute request

    const duration = Date.now() - start;
    console.log(`← ${request.method} ${request.url} (${duration}ms)`);
    return request;
  },
  { priority: -100 }
);

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

// Response transformation middleware
api.use('json-parser', async (request, next) => {
  await next();

  // Access response from request metadata
  const response = request.metadata.get('response');
  if (response.ok) {
    request.metadata.set('data', await response.json());
  }
  return request;
});

// Usage
const users = await api.get('/users');
const user = await api.post('/users', { name: 'John' });
```

**Key Changes from Original API:**

- ❌ Removed `api.intercept.response()` (confusing separate concept)
- ❌ Removed `api.intercept.error()` (confusing separate concept)
- ✅ Everything is now middleware with `async (request, next) => {}`
- ✅ One clear mental model: middleware chain with priority
- ✅ Middleware handles request prep, execution, and response processing

---

## Breaking Changes

### What Will Break

1. **TypeScript < 5.0**: Minimum TypeScript version bumped
2. **Node.js < 18**: Require native fetch support
3. **Deep imports**: Private APIs may change

### Migration Strategy (Comprehensive)

fej v2 follows industry best practices for major version transitions, inspired by successful migrations from React, Vue, and Angular. The strategy focuses on **minimal user pain** through advance warning, automation, and community support.

#### 1. Advance Warning (v1.9 Deprecation Release)

**Timeline:** 2 months before v2.0-alpha

**Implementation:**

- Release v1.9 with console.warn() for all deprecated patterns
- Warning messages include:
  - What is deprecated
  - Why it's changing
  - How to migrate (code example)
  - Link to migration guide
  - Timeline for v2.0 release

**Example Warning:**

```javascript
// User code in v1.9
Fej.setInit({ baseURL: 'https://api.example.com' });

// Console output:
// [Fej Deprecation Warning] Fej.setInit() is deprecated and will be removed in v2.0.
// Use instance-based configuration instead:
//   const api = new Fej({ baseURL: 'https://api.example.com' });
// Learn more: https://fej.dev/v2-migration
// v2.0 will be released in ~2 months (target: March 2026)
```

**Benefits:**

- Users have 2+ months to prepare (v1.9 → v2.0-alpha → beta → rc → stable)
- No surprises - clear communication of what's changing
- Working v1 code doesn't break immediately
- Users can migrate on their schedule

#### 2. Side-by-Side Compatibility Layer (v2.0)

**Implementation:** v2 includes a compatibility layer that supports v1 API with deprecation warnings

**Example:**

```javascript
// v1 API still works in v2.0 (with warnings)
import Fej from 'fej'; // v1 singleton import
Fej.setInit({ baseURL: 'https://api.example.com' });
Fej.addMiddleware(fn);
const response = await fej('/users');

// Works! But logs warnings suggesting v2 patterns
```

**Benefits:**

- Drop-in replacement - existing code works
- Gradual migration - update piece by piece
- No "big bang" rewrite required
- Users can ship v2 before fully migrating

**Trade-off:** Compatibility layer adds ~1-2KB to bundle size

- Removed in v2.1 or v3.0 after sufficient adoption
- Documented clearly in migration guide

#### 3. Automated Migration Tool (Codemod)

**Implementation:** jscodeshift-based codemod for automated code transformation

**Usage:**

```bash
# Install migration tool
npm install -g @fej/migrate

# Run on your codebase
npx @fej/migrate path/to/your/code

# Preview changes without modifying
npx @fej/migrate path/to/your/code --dry-run
```

**Transformations:**

```javascript
// Before (v1)
import Fej from 'fej';
Fej.setInit({ baseURL: 'https://api.example.com' });
Fej.addMiddleware(authMiddleware);
const response = await fej('/users');

// After (v2) - automatically transformed
import { createFej } from 'fej';
const api = createFej({ baseURL: 'https://api.example.com' });
api.use('auth', authMiddleware);
const response = await api.get('/users');
```

**Coverage:**

- Handles 80%+ of common migration patterns
- Manual review required for complex cases
- Generates report of changes made
- Preserves code style and formatting

**Development Timeline:**

- Start during Phase 0 (v1.9 development)
- Test on real v1 projects during alpha
- Refine based on alpha/beta feedback
- Release with v2.0 stable

#### 4. Comprehensive Migration Guide

**Location:** https://fej.dev/v2-migration (docs site) + MIGRATION.md in repo

**Structure:**

1. **Overview**
   - Why v2? (benefits, rationale)
   - What's changing? (high-level summary)
   - Timeline (v1.9 → alpha → beta → rc → stable)
   - When to migrate? (recommendations)

2. **Breaking Changes** (Side-by-side comparisons)
   For each breaking change:
   - ❌ **v1 (Old)**: `Fej.setInit({ ... })`
   - ✅ **v2 (New)**: `const api = new Fej({ ... })`
   - **Why?** Singleton pattern limited flexibility
   - **Impact:** Low - codemod handles automatically
   - **Manual Steps:** None if using codemod

3. **Step-by-Step Migration**
   - [ ] Update to v1.9 first (see deprecation warnings)
   - [ ] Review warnings in your console
   - [ ] Run codemod: `npx @fej/migrate .`
   - [ ] Review changes (dry-run first)
   - [ ] Update tests (if using private APIs)
   - [ ] Test thoroughly
   - [ ] Update package.json: `"fej": "^2.0.0"`
   - [ ] Deploy with monitoring

4. **Common Patterns**
   - Authentication patterns (Bearer token, API key)
   - Error handling patterns (retry, timeout)
   - Testing patterns (mocking, fixtures)
   - Framework integration (React hooks)

5. **Troubleshooting**
   - FAQ from beta users
   - Common errors and solutions
   - Performance debugging
   - Getting help (GitHub Discussions, Discord)

6. **Success Stories**
   - Real migration case studies
   - Time taken to migrate
   - Benefits observed
   - Tips from early adopters

#### 5. Community Migration Support

**Communication Channels:**

- **GitHub Discussions**: "v2 Migration" category
  - Q&A for migration issues
  - Share migration experiences
  - Report migration pain points

- **Discord Server** (if created): #v2-migration channel
  - Real-time help
  - Office hours with maintainer
  - Community peer support

- **Migration Workshop** (Optional): Live stream or video
  - Walk through migration of real project
  - Q&A session
  - Recorded for async viewing

**Issue Labeling System:**

- `v2-migration`: Migration-related issues
- `v2-bug`: Bugs specific to v2
- `v2-question`: Questions about v2
- `v2-blocker`: Critical issues blocking migration

**Support Commitments:**

- v2 migration issues: Response within 48 hours
- Critical v2 bugs: Response within 24 hours
- v1.x security issues: Response within 24 hours (12 months)
- v1.x critical bugs: Response within 48 hours (6 months)

#### 6. Success Metrics and Validation

**Alpha Phase Validation:**

- At least 3 alpha testers successfully migrate from v1 to v2
- Migration time measured: Target <2 hours for typical app
- Codemod accuracy: >80% of changes automated
- Zero migration blockers (P0 issues that prevent migration)

**Beta Phase Validation:**

- At least 10 production apps successfully migrated
- Migration guide tested by 5+ community members
- Common patterns documented from real migrations
- Codemod refined based on real project feedback

**Post-Launch Success:**

- 50% of active v1 users on v2 within 6 months
- <5% report migration as "difficult"
- Migration guide rated 4+ stars (if surveys collected)
- Active community helping each other migrate

#### 7. Rollback Strategy

**If v2 Adoption Fails:**

- v1.x maintenance extended to 18-24 months (from 12 months)
- v2.1 addresses major migration pain points
- Consider v2 as "opt-in" rather than replacement
- Reevaluate breaking changes for v3

**If Critical v2 Bug Found:**

- Immediate patch release (v2.0.1, v2.0.2, etc.)
- Clear communication about issue and fix
- Recommend v1.x users wait for patch
- Post-mortem and prevention plan

#### 8. Timeline Summary

```
v1.5 (Current)
    ↓
    2 months gap
    ↓
v1.9 (Deprecation Warnings) ← Prepare users
    ↓
    2 months development
    ↓
v2.0-alpha (Invite Only) ← 1 month testing
    ↓
v2.0-beta (Public) ← 1 month testing
    ↓
v2.0-rc (Feature Freeze) ← 2 weeks validation
    ↓
v2.0 (Stable) ← Official release
    ↓
    Parallel maintenance
    ↓
v1.x (Security: 12mo, Bugs: 6mo)
v2.x (Active development)
```

**Total Migration Window:** ~6 months from v1.9 to v2.0 stable
**Support Overlap:** 6-12 months of v1.x maintenance after v2.0 release

---

## Performance Targets

**IMPORTANT - Data-Driven Targets (Critical Review Point 9):**
These targets will be FINALIZED in Phase 0 after measuring v1 baseline performance. The targets below are preliminary and will be adjusted based on actual v1 data.

**Why This Matters:**

- Original plan set targets WITHOUT knowing v1 performance
- Risk: Setting impossible targets (e.g., <1ms if v1 is already 2ms)
- Risk: Not measuring actual improvement (is v2 faster or slower?)
- Solution: Phase 0 measures v1, then sets realistic v2 targets

### Preliminary Benchmarks (To Be Validated in Phase 0)

- **Request overhead**: Target based on v1 baseline (likely <5ms for 10 middleware)
  - Phase 0 will measure: v1 overhead with 1, 5, 10 middleware
  - v2 target: ≤ v1 overhead (no regression)
  - If v1 is 0.8ms/middleware, v2 targets ≤1ms/middleware
- **Middleware execution**: Target based on v1 baseline
  - Phase 0 will profile: `addMiddleware()` and `addAsyncMiddleware()` execution time
  - v2 target: Equal or better than v1
- **Memory usage**: Target based on v1 baseline
  - Phase 0 will measure: v1 heap usage for empty instance, 10 middleware, 1000 requests
  - v2 target: ≤ v1 + reasonable overhead for new features (likely <100KB heap per instance)
  - No memory leaks: Heap size should not grow over 1000 requests
- **Bundle size** (Realistic targets based on critical review):
  - Baseline: v1 is ~3KB minified (to be confirmed in Phase 0)
  - Minified: <10KB (full library with all 8-10 essential features)
  - Typical usage with tree-shaking: ~6-8KB
  - Minified + Gzipped: ~3-4KB
  - Note: With 8-10 essential features, 8-10KB is realistic and competitive
  - Phase 0 will analyze: v1 bundle size breakdown, identify optimization opportunities

### Bundle Size Strategy

1. **Modular exports**: Enable tree-shaking to reduce bundle size for typical usage
2. **Per-feature budget**: Each feature limited to ~0.8-1KB minified
3. **Automated CI checks**: Use `size-limit` to enforce bundle size limits
4. **Size monitoring**: Track bundle size in every PR with automated reporting

### Optimization Strategies

1. Lazy loading for optional features
2. Tree-shaking friendly exports
3. Minimal object creation
4. Efficient middleware chaining
5. Memoization where appropriate

---

## Security Considerations

### Security Features

- [ ] Input validation for middleware
- [ ] Secure header handling
- [ ] CSRF token support
- [ ] SameSite cookie handling
- [ ] Content Security Policy helpers

### Security Audits

- [ ] Automated security scanning (npm audit)
- [ ] Dependency vulnerability checks
- [ ] Code security review
- [ ] OWASP compliance check

---

## Dependencies Strategy

### Strict Zero Production Dependencies Policy ✅

**v2 Goal: ZERO production dependencies**

This is a **core identity** of fej and a major competitive advantage.

**Rationale:**

- Smaller bundle size
- No supply chain security risks
- Faster installs
- No dependency hell
- No version conflicts
- Fully auditable codebase
- Predictable behavior

**What "Zero Dependencies" Means:**

✅ **Allowed:**

- Native Node.js APIs (fetch, AbortController, Headers, URL)
- Native browser APIs (fetch, Headers, URL, AbortSignal)
- TypeScript (compiles away, not a runtime dependency)
- Dev dependencies (testing, build tools, linting)
- Peer dependencies for optional framework integrations (user's choice)

❌ **NOT Allowed:**

- Production runtime dependencies of ANY kind
- External libraries for core functionality
- Utility libraries (lodash, ramda, etc.)
- Validation libraries (Zod, Yup, io-ts)
- Caching libraries (lru-cache, quick-lru)
- Circuit breaker libraries (opossum, cockatiel)

**Impact on Features:**

This strict policy means some features are **explicitly excluded** from v2.0:

1. ❌ **Runtime Type Validation** - Would require Zod/Yup or 2-3KB custom implementation
   - **Alternative**: Users can validate data after receiving responses using their preferred library
   - **Future**: Could be added as optional peer dependency plugin in v2.2+

2. ❌ **Circuit Breaker Pattern** - Would require complex library or 3-5KB custom implementation
   - **Too Complex**: State machine, failure tracking, health checks, metrics
   - **Alternative**: Users implement simple retry logic with our retry middleware
   - **Future**: Could be separate `fej-plugin-circuit-breaker` package in v2.2+

3. ❌ **Advanced Caching Layer** - Would require LRU library or 2-4KB custom implementation
   - **Too Complex**: LRU eviction, TTL management, serialization, memory limits
   - **Alternative**: Users can implement simple caching or use browser's Cache API
   - **Future**: Could be separate `fej-plugin-cache` package in v2.2+ with peer dependency on lru-cache

4. ❌ **Request Deduplication** - Complex implementation requiring request tracking
   - **Alternative**: Not essential for most use cases
   - **Future**: Could be added in v2.3+ if demand justifies complexity

**Plugin Architecture (Future v2.2+):**

For features that genuinely need dependencies, we'll offer an optional plugin system:

```typescript
// Core: zero dependencies
import { createFej } from 'fej';

// Plugins: optional with peer dependencies (user's choice)
import cachePlugin from '@fej/plugin-cache'; // peer: lru-cache
import circuitBreakerPlugin from '@fej/plugin-circuit-breaker'; // peer: opossum

const api = createFej()
  .use(cachePlugin({ maxSize: 100 }))
  .use(circuitBreakerPlugin({ threshold: 5 }));
```

This way:

- Core library: **ZERO dependencies** ✅
- Power users: Can opt-in to features with dependencies
- Bundle size: Users only pay for what they use

**Enforcement:**

- CI checks that `dependencies` field in package.json is empty
- Regular audits of imports to prevent accidental dependencies
- Clear documentation about this policy

---

## Testing Strategy

### Test Coverage Goals (SMART - NOT Vanity Metrics)

**IMPORTANT**: We do NOT use percentage-based coverage goals (90%, 80%) because:

- Coverage percentages can be gamed (trivial tests increase coverage without testing behavior)
- High coverage does NOT equal good tests
- Focus should be on meaningful test cases, not hitting arbitrary percentages

Instead, we use **specific, measurable criteria**:

#### Unit Tests

- **All public APIs tested**: Every function exported in `src/index.ts` has unit tests
  - **Measurement**: Manual audit - create checklist of exports vs test files
  - **Minimum per function**: 3 test cases (success case, error case, edge case)
  - **Verification**: CI check fails if public API lacks corresponding test file
- **All error conditions tested**: Every `throw`, `catch`, and error path has test
  - **Measurement**: Code review identifies error paths, verify test exists
  - **Examples**: Network failures, timeouts, invalid inputs, abort scenarios
- **All edge cases covered**: Boundary conditions and special cases tested
  - **Examples**: Empty arrays, null/undefined, maximum values, concurrent requests

#### Integration Tests

- **All middleware chain scenarios tested**: Complete request flow through middleware chain with real HTTP
  - **Specific tests required**:
    1. Single middleware execution
    2. Multiple middleware in correct priority order
    3. Middleware error propagation
    4. Request transformation through chain
    5. Response transformation through chain
    6. Middleware cancellation with AbortController
  - **Measurement**: Checklist of scenarios, each has integration test
  - **Implementation**: Use native Node.js `http` server (NOT MSW)

#### Browser Compatibility Tests (NOT E2E)

- **All target browsers tested**: Chrome, Firefox, Safari, Edge (latest 2 versions each)
  - **Specific browsers**: Chrome 120+, Firefox 120+, Safari 17+, Edge 120+
  - **Measurement**: CI runs browser tests in actual browsers via Playwright
  - **Scenarios**: fetch API, Headers, AbortController work correctly
- **NOT E2E tests**: E2E is for applications, not libraries
  - Libraries test their own behavior, not full application flows
  - We don't need Cypress/Playwright for user flows

#### Performance Tests

- **Benchmark suite measures overhead**: Compare middleware overhead vs baseline
  - **Specific benchmarks**:
    1. Request with 0 middleware (baseline measurement)
    2. Request with 1 middleware (<1ms overhead vs baseline)
    3. Request with 5 middleware (<3ms overhead vs baseline)
    4. Request with 10 middleware (<5ms overhead vs baseline)
  - **Measurement**: Run on standardized hardware, compare to baseline
  - **NOT absolute times**: Hardware varies, measure relative overhead
- **Memory leak detection**: 1000 request test shows no memory growth
  - **Measurement**: Heap snapshots before/after, memory delta <1MB
  - **Tool**: Node.js `--inspect`, Chrome DevTools memory profiler

### Test Types (Detailed Specifications)

1. **Unit Tests**
   - **Scope**: Individual functions and methods in isolation
   - **What to test**:
     - Every public function exported from `src/index.ts`
     - Every class method (public and important private methods)
     - Edge cases: empty inputs, null, undefined, max values
     - Error conditions: invalid inputs, network failures, timeouts
   - **What NOT to test**: Internal implementation details not part of public API
   - **Tools**: Vitest, vi.fn() for mocks
   - **Measurement**: Checklist of public APIs, verify each has test file with 3+ tests

2. **Integration Tests**
   - **Scope**: Multiple components working together with real HTTP
   - **What to test**:
     - Middleware chains execute in correct order
     - Request transformations flow correctly
     - Response transformations flow correctly
     - Error propagation through middleware
     - AbortController cancellation across middleware
     - Real HTTP requests to local test server
   - **What NOT to test**: External APIs (use mocks or local server)
   - **Tools**: Vitest, native Node.js `http` module for local server
   - **Measurement**: Checklist of integration scenarios, verify each has test

3. **Browser Compatibility Tests (NOT E2E)**
   - **Scope**: Ensure native APIs work across browsers
   - **What to test**:
     - fetch API availability and behavior
     - Headers object manipulation
     - AbortController and AbortSignal
     - URL and URLSearchParams
     - Promise and async/await
   - **Browsers**: Chrome 120+, Firefox 120+, Safari 17+, Edge 120+ (2 latest versions)
   - **Tools**: Playwright for automated browser testing
   - **NOT E2E**: We're testing the library, not full application scenarios
   - **Measurement**: Tests pass in all 4 browsers in CI

4. **Performance Tests**
   - **Scope**: Measure overhead and ensure no regressions
   - **What to test**:
     - Middleware overhead (relative to baseline)
     - Memory usage (no leaks over 1000 requests)
     - Large payload handling (body size impact)
   - **What NOT to test**: Absolute times (hardware dependent)
   - **Tools**: Vitest bench mode, Node.js profiling
   - **Measurement**: Overhead stays within targets, memory delta <1MB

### Testing Tools

- **Test Runner**: Vitest (fast, modern, lightweight)
- **Assertions**: Vitest built-in (no extra dependencies)
- **HTTP Mocking**: Simple fetch mocks + local HTTP server for integration tests
  - Unit tests: Mock fetch with `vi.fn()`
  - Integration tests: Real HTTP server (Node.js `http` module)
  - **NO MSW**: Avoids 30KB dev dependency
- **Coverage**: Vitest coverage (built-in)
- **Browser Testing**: Playwright (for cross-browser compatibility checks only)
- **NO E2E**: Libraries don't need end-to-end testing (not an application)

---

## Documentation Strategy

### Documentation Types

#### 1. **API Reference** (Auto-generated)

- JSDoc comments for all public APIs
- TypeScript types as documentation
- TypeDoc for HTML output

#### 2. **Guides** (Hand-written)

- Getting started
- Core concepts
- Advanced usage
- Best practices
- Migration guides

#### 3. **Examples** (Code samples)

- Cookbook recipes
- Integration examples
- Real-world use cases
- Video tutorials

#### 4. **Interactive** (Playground)

- Online REPL/playground
- Interactive examples
- Try before install

### Documentation Platform

- **Primary**: GitHub README
- **Extended**: GitHub Wiki or Docusaurus site
- **API Docs**: TypeDoc hosted on GitHub Pages
- **Examples**: CodeSandbox/StackBlitz

---

## Community Building

### Communication Channels

- GitHub Discussions for Q&A
- Discord server for real-time help
- Twitter for announcements
- Blog for deep dives

### Contribution Opportunities

- Bug fixes and features
- Documentation improvements
- Example contributions
- Test coverage improvements
- Performance optimizations
- Middleware plugins

### Incentives

- Contributor recognition
- "Good first issue" labels
- Hacktoberfest participation
- Showcase contributor projects

---

## Maintenance Plan

### Regular Activities

- **Weekly**: Triage new issues
- **Bi-weekly**: Review PRs
- **Monthly**: Dependency updates
- **Quarterly**: Major version planning
- **Annually**: Security audit

### Release Schedule

- **Patch releases**: As needed (bug fixes)
- **Minor releases**: Every 2-3 months (features)
- **Major releases**: Yearly (breaking changes)

---

## Success Metrics

### Adoption Metrics (Measured at 3 and 6 months post-launch)

- **npm downloads per week**: >1,000 weekly downloads by month 3
  - **Measurement**: npm stats dashboard, public npm download counts
  - **Baseline**: v1.x had ~X downloads/week (measure before launch)
- **GitHub stars**: >500 stars by month 6
  - **Measurement**: GitHub repository star count
  - **Baseline**: Current stars at launch
- **Active contributors**: >10 unique contributors by month 6
  - **Measurement**: GitHub insights, count unique commit authors
  - **Definition**: "Active" = at least 1 merged PR in last 3 months
- **Open issues**: <20 open issues maintained
  - **Measurement**: GitHub issues page, filter by open issues
  - **Action**: Triage weekly, close stale issues, respond within 48h
- **Issue response time**: <48 hours for initial triage
  - **Measurement**: Time from issue creation to first maintainer response
  - **Definition**: "Response" = comment, label, or status change (not necessarily resolution)

### Quality Metrics (Measured at release and continuously)

- **All public APIs have unit tests**: 100% of exported functions tested
  - **Measurement**: Manual audit of `src/index.ts` exports vs test files
  - **Specific**: Each public function has success case, error case, and edge case tests
  - **NOT test coverage %**: Coverage can be gamed, focus on meaningful tests
- **All error conditions have test cases**: Every `throw` and `catch` block tested
  - **Measurement**: Manual code review to identify error paths, verify tests exist
  - **Specific**: Network errors, timeout errors, abort errors, validation errors
- **Build success rate**: >98% of CI runs pass on main branch
  - **Measurement**: GitHub Actions success rate over last 30 days
  - **Action**: Fix flaky tests, improve CI stability
- **Zero P0/P1 bugs**: Zero critical/high bugs at release
  - **Measurement**: Bug tracker filtered by P0/P1 severity, count must be 0
  - **Definition**: P0 = crashes/data loss/security, P1 = broken core functionality
- **TypeScript strict mode**: Zero type errors with strict: true
  - **Measurement**: `tsc --noEmit` exits with code 0
  - **Verification**: Automated in CI, blocks merges
- **Bundle size enforced**: All size limits pass
  - **Measurement**: `size-limit` checks pass: <10KB full, <8KB typical, <5KB core
  - **Verification**: Automated in CI, PR comments show impact
- **100% API documentation coverage**: All public APIs have JSDoc + examples
  - **Measurement**: TypeDoc generates docs without warnings
  - **Specific**: Every export has description, params, returns, and code example
  - **Verification**: CI fails on TypeDoc warnings

### Community Metrics (Measured monthly)

- **Monthly active contributors**: >5 unique contributors per month by month 6
  - **Measurement**: GitHub insights, unique authors with merged PRs in last 30 days
  - **Action**: "Good first issue" labels, contributor recognition, welcoming culture
- **Documentation PRs**: >10 documentation improvements by month 6
  - **Measurement**: Count PRs labeled "documentation" that are merged
  - **Action**: Encourage docs contributions, clear contributing guide
- **Example contributions**: >5 new code examples by month 6
  - **Measurement**: Count new files in examples/ directory from external contributors
  - **Action**: Example templates, showcase contributor examples
- **Community questions**: Questions asked on GitHub Discussions or Stack Overflow
  - **Measurement**: Count questions tagged with "fej" on Stack Overflow, Discussions activity
  - **Goal**: Presence indicates adoption, not a specific number target

---

## Risk Assessment

**Updated based on Critical Review Point 8**: The original risk assessment was too optimistic. This comprehensive risk register uses realistic probabilities and includes contingency plans.

### Risk Scoring System

- **Impact Scale**: 1 (Minimal) to 5 (Critical)
- **Probability Scale**: 1 (Very Low) to 5 (Very High)
- **Risk Score**: Impact × Probability (max 25)
- **Priority**: High (16-25), Medium (8-15), Low (1-7)

---

### Technical Risks

| Risk ID | Risk                                     | Impact | Probability  | Score  | Priority   | Mitigation                                                                                                                                                                                                         | Contingency Plan                                                                                                                                                                                    |
| ------- | ---------------------------------------- | ------ | ------------ | ------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-01    | **Breaking changes alienate users**      | 5      | **4** (HIGH) | **20** | **HIGH**   | - Compatibility layer in v2.0<br>- v1.9 deprecation warnings 2 months early<br>- Comprehensive migration guide with examples<br>- Automated codemod for 80%+ migrations<br>- Staged rollout (alpha→beta→rc→stable) | - Extend v1.x support to 18-24 months if adoption is slow<br>- Create v2-lite with fewer breaking changes<br>- Offer migration consulting/workshops<br>- Survey non-adopters to understand blockers |
| T-02    | **Bundle size growth beyond 10KB**       | 4      | **4** (HIGH) | **16** | **HIGH**   | - Automated size-limit CI checks (fail on exceed)<br>- Per-feature budget (~0.8-1KB each)<br>- Tree-shaking friendly exports<br>- Regular bundle analysis<br>- Size reporting on every PR                          | - Remove features if bundle exceeds 10KB<br>- Split into core + optional plugins<br>- Defer features to v2.1+<br>- Investigate code splitting options                                               |
| T-03    | **Performance regression vs v1**         | 4      | 3 (MEDIUM)   | 12     | **MEDIUM** | - Benchmark suite comparing v1 vs v2<br>- Performance tests in CI<br>- Memory profiling<br>- Set targets: ≤5ms overhead for 10 middleware                                                                          | - Optimize hot paths if regression detected<br>- Profile and identify bottlenecks<br>- Consider caching compiled middleware chain<br>- Accept minor regression if features justify it               |
| T-04    | **Security vulnerabilities**             | 5      | 2 (LOW)      | 10     | **MEDIUM** | - npm audit in CI<br>- Snyk/Dependabot scanning<br>- Security audit (self or professional)<br>- Code review focusing on security<br>- Zero dependencies = smaller attack surface                                   | - Immediate patch release<br>- Security advisory on GitHub<br>- Contact known users directly<br>- Rollback to previous version if critical<br>- Public disclosure after fix                         |
| T-05    | **Browser compatibility issues**         | 3      | 2 (LOW)      | 6      | **LOW**    | - Automated browser testing (Chrome, Firefox, Safari, Edge)<br>- Test on real devices, not just simulators<br>- Check caniuse.com for all APIs used<br>- Polyfill strategy documented                              | - Detect browser and show warning<br>- Document minimum browser versions<br>- Provide polyfills if feasible<br>- Drop support for unsupported browsers                                              |
| T-06    | **TypeScript breaking changes**          | 3      | 3 (MEDIUM)   | 9      | **MEDIUM** | - Test against TS 5.0, 5.1, 5.2+<br>- Monitor TypeScript release notes<br>- Use stable type patterns<br>- Avoid experimental features                                                                              | - Update types in patch release<br>- Document TS version compatibility<br>- Provide type definitions for older TS if needed                                                                         |
| T-07    | **Fetch API divergence across runtimes** | 3      | 2 (LOW)      | 6      | **LOW**    | - Test in Node.js 18, 20, 22<br>- Test in browsers<br>- Abstract fetch interface if needed<br>- Document runtime requirements                                                                                      | - Provide runtime-specific adapters<br>- Document known differences<br>- Consider fetch polyfill for edge cases                                                                                     |
| T-08    | **Technical debt accumulation**          | 4      | **4** (HIGH) | **16** | **HIGH**   | - Code reviews on all PRs<br>- Regular refactoring sprints<br>- Quality gates in CI<br>- Document architectural decisions (ADRs)<br>- Monthly tech debt review                                                     | - Schedule tech debt reduction phase<br>- Reject features that increase debt significantly<br>- Consider v3 if debt becomes unmanageable                                                            |
| T-09    | **Test maintenance burden**              | 3      | 3 (MEDIUM)   | 9      | **MEDIUM** | - Keep tests simple and focused<br>- Use test utilities for common patterns<br>- Avoid brittle tests<br>- Document test strategy                                                                                   | - Refactor flaky tests immediately<br>- Remove redundant tests<br>- Consider property-based testing for edge cases                                                                                  |
| T-10    | **Documentation staleness**              | 3      | **4** (HIGH) | 12     | **MEDIUM** | - Docs updated in same PR as code<br>- Automated link checking<br>- Community review of docs<br>- Quarterly docs audit                                                                                             | - Schedule docs sprint<br>- Mark stale sections prominently<br>- Accept community PRs for docs updates<br>- Use inline examples that are tested                                                     |

---

### Project Risks

| Risk ID | Risk                                      | Impact | Probability       | Score  | Priority        | Mitigation                                                                                                                                                                                                          | Contingency Plan                                                                                                                                                                      |
| ------- | ----------------------------------------- | ------ | ----------------- | ------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P-01    | **Scope creep delays release**            | 5      | **5** (VERY HIGH) | **25** | **🔥 CRITICAL** | - **70% feature reduction applied**<br>- Only 8-10 essential features in v2.0<br>- Formal change control process<br>- Weekly scope review<br>- Defer non-essential features to v2.1+                                | - **Feature freeze at Phase 2 completion**<br>- Cut additional features if needed<br>- Push to v2.1 instead of cramming into v2.0<br>- Accept smaller v2.0 to meet timeline           |
| P-02    | **Maintainer burnout**                    | 5      | **4** (HIGH)      | **20** | **HIGH**        | - Realistic 6-8 month timeline (not 3-5)<br>- 25-30h/week sustainable pace<br>- Find co-maintainer early<br>- Regular breaks and time off<br>- Community involvement<br>- Track hours vs estimate weekly            | - Take extended break if needed<br>- Pause development temporarily<br>- Hand off to co-maintainer<br>- Reduce scope further<br>- Accept delay over burnout                            |
| P-03    | **v1 users don't upgrade**                | 4      | **4** (HIGH)      | **16** | **HIGH**        | - Compelling value proposition (named MW, priority, etc.)<br>- Smooth migration (codemod, compat layer)<br>- Extensive docs and examples<br>- v1.9 warnings give advance notice<br>- Beta program builds excitement | - Survey non-adopters for reasons<br>- Address top migration blockers<br>- Extend v1.x support timeline<br>- Create v2-lite with fewer changes<br>- Market benefits more aggressively |
| P-04    | **Low adoption rate**                     | 4      | 3 (MEDIUM)        | 12     | **MEDIUM**      | - High-quality documentation<br>- Marketing campaign (blog, social, HN)<br>- Show HN post<br>- Showcase early adopter success<br>- SEO optimization                                                                 | - Analyze competitors' advantages<br>- Survey potential users<br>- Identify and address gaps<br>- Consider pivoting features<br>- Accept niche status if quality is high              |
| P-05    | **Competing library releases v2**         | 3      | 3 (MEDIUM)        | 9      | **MEDIUM**      | - Focus on unique value: zero dependencies<br>- Simple API, not feature bloat<br>- Better DX than competitors<br>- Fast to market with MVP                                                                          | - Differentiate more clearly<br>- Adopt best ideas from competitors<br>- Collaborate instead of compete<br>- Focus on underserved niche                                               |
| P-06    | **Features too complex for users**        | 4      | 3 (MEDIUM)        | 12     | **MEDIUM**      | - User testing during alpha/beta<br>- Simple API examples first<br>- Progressive disclosure of complexity<br>- Quality docs and guides                                                                              | - Simplify API based on feedback<br>- Add beginner-friendly presets<br>- Create "easy mode" defaults<br>- More examples and tutorials                                                 |
| P-07    | **Can't maintain all features long-term** | 4      | **4** (HIGH)      | **16** | **HIGH**        | - **Reduced scope to 8-10 essential features**<br>- Plugin architecture for optional features<br>- Community maintainers for plugins<br>- Focus on core stability                                                   | - Deprecate least-used features<br>- Move features to community plugins<br>- Focus on core only in v3<br>- Find co-maintainers for specific areas                                     |
| P-08    | **Key contributor leaves**                | 4      | 3 (MEDIUM)        | 12     | **MEDIUM**      | - Document everything (code, decisions, process)<br>- Bus factor > 1 (find co-maintainer)<br>- Knowledge sharing<br>- Architecture Decision Records (ADRs)                                                          | - Onboard new maintainer quickly<br>- Pause feature work, focus on stability<br>- Community steps up<br>- Archive project if necessary (mark as maintained)                           |
| P-09    | **Critical bug post-launch**              | 5      | 3 (MEDIUM)        | 15     | **MEDIUM**      | - Comprehensive testing (all APIs, edge cases)<br>- Beta program catches issues early<br>- Staged rollout (alpha→beta→rc→stable)<br>- Monitoring and error tracking                                                 | - **Immediate hotfix release**<br>- Rollback npm "latest" tag if critical<br>- Public communication<br>- Post-mortem and prevention plan                                              |
| P-10    | **Timeline slips significantly**          | 4      | **4** (HIGH)      | **16** | **HIGH**        | - Realistic estimates (620-850h, not 300-420h)<br>- 30% contingency buffer<br>- Weekly progress tracking<br>- Adjust early if slipping                                                                              | - Cut scope to meet original timeline<br>- Extend timeline but communicate clearly<br>- Ship MVP and iterate<br>- Accept delay, don't compromise quality                              |

---

### External Risks

| Risk ID | Risk                                                | Impact | Probability  | Score | Priority | Mitigation                                                                                                                               | Contingency Plan                                                                                                                      |
| ------- | --------------------------------------------------- | ------ | ------------ | ----- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| E-01    | **Breaking ecosystem changes** (Node.js, fetch API) | 4      | 2 (LOW)      | 8     | **LOW**  | - Monitor Node.js release notes<br>- Test on multiple Node versions<br>- Use stable APIs only<br>- Avoid experimental features           | - Update quickly to accommodate<br>- Provide adapter layer if needed<br>- Document breaking changes<br>- Pin minimum versions clearly |
| E-02    | **Funding/sponsorship insufficient**                | 2      | 3 (MEDIUM)   | 6     | **LOW**  | - Open source = no funding required<br>- Side project expectations<br>- No paid services dependency<br>- Community-driven                | - Continue as unfunded project<br>- Reduce time commitment<br>- Accept slower pace<br>- Not a blocker for this project                |
| E-03    | **Legal issues** (license, patents)                 | 5      | 1 (VERY LOW) | 5     | **LOW**  | - MIT license (permissive, battle-tested)<br>- No proprietary code or patents<br>- Clean room implementation<br>- Legal review if needed | - Consult lawyer if issue arises<br>- Change license if required<br>- Remove problematic code<br>- Settle or defend as appropriate    |

---

### Risk Management Process

#### Weekly Risk Review (During Development)

**Every Monday, review top 10 risks:**

1. Check status of top risks (P-01, T-01, T-02, P-02, P-03, P-07, T-08, P-10)
2. Update probabilities based on progress
3. Adjust mitigation strategies if needed
4. Escalate new risks discovered
5. Close resolved risks
6. Document decisions in decision log

#### Monthly Comprehensive Review

**First Monday of each month:**

1. Review ALL risks in register
2. Add new risks identified
3. Re-score existing risks
4. Update contingency plans
5. Share risk status in project update
6. Adjust timeline/scope if needed

#### Risk Escalation Criteria

**Immediate escalation if:**

- Any risk reaches score 20+ (CRITICAL)
- Timeline slips >2 weeks
- Budget exceeds estimate by >30%
- Key contributor becomes unavailable
- Critical security vulnerability discovered
- Competitor launches similar v2

#### Top 5 Risks to Monitor Closely

1. **🔥 P-01: Scope creep** (Score: 25) - Already mitigated with 70% reduction, but monitor constantly
2. **🔥 P-02: Maintainer burnout** (Score: 20) - Track hours weekly, watch for signs
3. **🔥 T-01: Breaking changes alienate users** (Score: 20) - Beta feedback critical
4. **🔥 T-02: Bundle size growth** (Score: 16) - Automated checks, reject oversize PRs
5. **🔥 T-08: Technical debt** (Score: 16) - Regular refactoring, don't defer

---

### Risk Register Updates

**Log all risk register updates:**

| Date       | Risk ID | Change                                | Reason                            | Updated By   |
| ---------- | ------- | ------------------------------------- | --------------------------------- | ------------ |
| 2025-10-16 | ALL     | Initial comprehensive risk assessment | Critical review point 8 addressed | Claude       |
| (future)   | (ID)    | (probability/impact change)           | (weekly review findings)          | (maintainer) |

**How to Update:**

1. Add new row when risk probability, impact, or status changes
2. Document reason for change
3. Keep history for post-mortem analysis
4. Review history quarterly to learn patterns

---

### Risk Categories Added (Previously Missing)

Based on Critical Review Point 8, the following risk categories have been added:

✅ **Technical Risks**: 10 risks identified (T-01 to T-10)

- T-08: Technical debt accumulation (NEW)
- T-09: Test maintenance burden (NEW)
- T-10: Documentation staleness (NEW)

✅ **Project Risks**: 10 risks identified (P-01 to P-10)

- P-01: Scope creep delays release (NEW)
- P-06: Features too complex (NEW)
- P-07: Can't maintain all features (NEW)
- P-08: Key contributor leaves (NEW)
- P-09: Critical bug post-launch (NEW)
- P-10: Timeline slips (NEW)

✅ **External Risks**: 3 risks identified (E-01 to E-03)

- E-01: Breaking ecosystem changes (NEW)
- E-02: Funding/sponsorship (NEW)
- E-03: Legal issues (NEW)

**Total: 23 risks tracked** (up from 9 in original plan)

---

## Budget and Resources

### Realistic Time Estimates (Updated from Critical Review + Point 9)

- **Phase 0 (Preparation)**: 65-90 hours (increased from 30-40h to include comprehensive baseline measurement)
  - Baseline Measurement: 25-35h (NEW - was completely missing in original plan)
  - Bug Documentation: 8-12h
  - v1.9 Release + User Communication: 12-18h
  - Migration Tooling: 20-25h
- **Phase 1 (Foundation)**: 150-220 hours (+88% from original 80-120h)
- **Phase 2 (Core Features)**: 220-300 hours (+106% from original 120-160h)
- **Phase 3 (Documentation)**: 125-160 hours (+150% from original 60-80h)
- **Phase 4 (Beta & Launch)**: 95-130 hours (+33% from original 40-60h)
- **Total**: 655-900 hours (+119% from original 300-420h estimate)

**Why These Estimates Are More Realistic:**

- Accounts for unexpected complexity and edge cases
- Includes time for comprehensive testing and documentation
- Factors in review cycles and iterations
- Includes buffer for troubleshooting and bug fixes
- Based on industry experience with similar projects

### Timeline Projections (Based on Realistic Estimates)

- **At 20 hours/week**: 33-45 weeks (8-11 months)
- **At 30 hours/week**: 22-30 weeks (5-7.5 months)
- **At 40 hours/week**: 16-23 weeks (4-5.75 months) - NOT SUSTAINABLE (burnout risk)

### Recommended Approach

- **Target**: 25-30 hours/week for sustainable pace (prevents burnout)
- **Duration**: 6-8.5 months to completion (updated from 6-8 months to account for baseline measurement)
- **With 30% contingency buffer**: 8-11 months realistic timeline
- **Weekly tracking**: Monitor actual vs estimated hours to adjust timeline early

**Key Addition from Critical Review Point 9:**
Phase 0 now includes 25-35 hours of baseline measurement work that was completely missing from the original plan. This is essential because:

- Cannot set realistic targets without knowing current v1 performance
- Cannot measure improvement without baseline data
- Prevents setting impossible targets (like <1ms overhead when v1 might already be 2ms)
- Identifies bottlenecks to avoid in v2 architecture

**Note:** The original plan estimated 3-5 months (300-420 hours), which was **off by ~100%**. These revised estimates are based on:

1. Historical data from similar library projects
2. Accounting for comprehensive testing requirements
3. Documentation time (often 3x longer than expected)
4. Unexpected bugs and edge cases (20-30% buffer)
5. Review and iteration cycles

### Required Skills

- TypeScript/JavaScript expertise
- Testing and CI/CD knowledge
- Technical writing
- Open source maintenance
- Community management

---

## Post-Launch Roadmap (v2.1+)

### Future Enhancements (Zero-Dependency Maintained)

- **v2.1**: Additional middleware utilities (all zero-dependency)
  - API key middleware
  - Basic timeout middleware
  - Request transformation middleware
- **v2.2**: Plugin architecture + official plugins (WITH dependencies as peer deps)
  - `@fej/plugin-cache` (peer: lru-cache) - Advanced caching with LRU
  - `@fej/plugin-circuit-breaker` (peer: opossum) - Circuit breaker pattern
  - `@fej/plugin-validation` (peer: zod) - Runtime validation
- **v2.3**: Framework integrations
  - `@fej/vue` - Vue composables (peer: vue)
  - `@fej/svelte` - Svelte stores (peer: svelte)
  - Additional React patterns
- **v2.4**: Advanced features (zero-dependency)
  - GraphQL support (using native fetch)
  - WebSocket middleware (using native WebSocket API)
- **v2.5**: Platform support
  - React Native specific optimizations
  - Deno and Bun support

### Plugin Ecosystem Architecture (v2.2+)

**Core Principle**: Plugins can have dependencies, but core library NEVER will

**Official Plugins (Optional, With Peer Dependencies):**

- `@fej/plugin-cache` - Advanced caching (peer: lru-cache)
- `@fej/plugin-circuit-breaker` - Circuit breaker (peer: opossum or cockatiel)
- `@fej/plugin-validation` - Runtime validation (peer: zod)
- `@fej/plugin-deduplication` - Request deduplication (may have peer deps)

**Official Middleware Utilities (Zero-Dependency, Built-in):**

- Bearer auth middleware ✅ (already in v2.0)
- Logger middleware ✅ (already in v2.0)
- Basic retry middleware ✅ (already in v2.0)
- API key middleware (v2.1)
- Timeout middleware (v2.1)

**Framework Integrations (Optional, With Peer Dependencies):**

- `@fej/react` - React hooks (peer: react) ✅ (in v2.0)
- `@fej/vue` - Vue composables (peer: vue) (v2.3)
- `@fej/svelte` - Svelte stores (peer: svelte) (v2.3)

**Community Plugins:**

- Users can publish their own plugins
- Can have dependencies (user's choice to install)
- Core fej remains dependency-free

---

## Cost and Opportunity Analysis

### Purpose

Before committing 6-8 months and 650-900 hours to this project, it's critical to evaluate the **why** and **what else** to ensure this is the best use of time and resources.

### Financial Costs (Potential)

| Item                          | Estimated Cost                | Required?                 |
| ----------------------------- | ----------------------------- | ------------------------- |
| Domain (fej.dev or similar)   | $10-50/year                   | Optional                  |
| Documentation hosting         | $0 (GitHub Pages)             | No                        |
| CI/CD                         | $0 (GitHub Actions free tier) | No                        |
| Security audit (professional) | $2,000-10,000                 | Optional (can self-audit) |
| Code signing certificate      | $100-500/year                 | Optional                  |
| Design work (logo, branding)  | $0-2,000                      | Optional                  |
| Promotional (ads, content)    | $0-1,000                      | Optional                  |
| **Total Minimum**             | **$0**                        | ✅ Can be done for free   |
| **Total Maximum**             | **~$14,000**                  | If doing everything       |

### Time Investment Analysis

**Realistic Time Commitment:** 655-900 hours

**Opportunity Cost (at market rates):**

- At $50/hour: $32,750 - $45,000
- At $100/hour: $65,500 - $90,000
- At $150/hour: $98,250 - $135,000

**What Else Could Be Done With This Time:**

- Build 2-3 smaller open source projects
- Contribute significantly to existing popular libraries (React, Vue, etc.)
- Build a profitable SaaS product
- Consulting work (paid)
- Learn 2-3 new technologies in depth
- Write a technical book or course

### Why Are You Doing This?

**Evaluate your motivations** (check all that apply):

- [ ] **Career growth**: Will this help me get a better job or promotion?
- [ ] **Learning**: Do I want to learn library design, testing, open source maintenance?
- [ ] **Portfolio**: Will this strengthen my portfolio significantly?
- [ ] **Solve own problem**: Am I personally frustrated by existing solutions?
- [ ] **Help community**: Do I believe this will help many developers?
- [ ] **Fun**: Do I genuinely enjoy working on this type of project?
- [ ] **Sponsorship/money**: Do I expect financial return (GitHub sponsors, donations)?
- [ ] **Reputation**: Will this increase my standing in the developer community?
- [ ] **Other**: ****************\_****************

**If you checked fewer than 3 boxes above, reconsider whether this is worth the investment.**

### Expected Return on Investment (ROI)

#### Tangible Benefits (Measurable)

- **Job opportunities**: Will maintainers contact me for jobs?
- **Sponsorship income**: Realistic target: $0-500/month (most open source earns nothing)
- **Consulting leads**: Will users hire me for consulting?
- **Speaking engagements**: Will conferences invite me to speak?

#### Intangible Benefits (Valuable but not measurable)

- **Skill improvement**: Library design, testing, open source management
- **Network expansion**: Connections with contributors and users
- **Reputation boost**: Recognition in JavaScript/fetch API community
- **Personal satisfaction**: Pride in building something useful
- **Learning experience**: Deep knowledge of HTTP, middleware patterns, tooling

### What Does Success Look Like?

**Define concrete success metrics** (be honest with yourself):

#### Download Metrics

- [ ] 1,000+ npm downloads/week by month 6
- [ ] 5,000+ npm downloads/week by year 1
- [ ] 10,000+ npm downloads/week by year 2

#### Community Metrics

- [ ] 500+ GitHub stars by month 6
- [ ] 10+ active contributors by year 1
- [ ] Used in 50+ production applications
- [ ] Featured in at least 3 articles/tutorials

#### Personal Metrics

- [ ] Led to 1+ job offer or consulting opportunity
- [ ] Learned skills that improved my day job performance
- [ ] Received $X in sponsorships/donations (specify: **\_\_\_**)
- [ ] Invited to speak at 1+ conference or meetup
- [ ] Genuinely enjoyed the process and would do it again

### Opportunity Cost Evaluation

**What else could you build with 650-900 hours?**

Compare against alternatives:

1. **Contribute to existing libraries** (axios, ky, wretch, fetch)
   - Pros: Instant large user base, less maintenance burden, recognition
   - Cons: Less control, not "your" project

2. **Build a profitable product/SaaS**
   - Pros: Potential for revenue, ownership, entrepreneurial experience
   - Cons: Higher risk, more business skills needed

3. **Learn new technologies** (Rust, Go, AI/ML, etc.)
   - Pros: Expand skill set, increase employability
   - Cons: Less tangible output, no project to show

4. **Consulting/Freelancing**
   - Pros: Direct income, diverse projects, networking
   - Cons: Time-bound income, no lasting asset

**Honestly rank these options (1 = most valuable to you):**

1. ***
2. ***
3. ***
4. ***

If fej v2 is NOT ranked #1, reconsider whether to proceed.

### Exit Strategy

**What if this doesn't succeed?** Plan for different scenarios:

#### Scenario 1: Low Adoption (<500 downloads/week after 6 months)

- [ ] **Accept and maintain minimally**: Keep it working, no new features
- [ ] **Archive the project**: Mark as unmaintained, direct users elsewhere
- [ ] **Pivot to different approach**: Maybe merge with another library?
- [ ] **Continue anyway**: Value is in the learning, not downloads

#### Scenario 2: Maintainer Burnout (Too much work)

- [ ] **Find co-maintainer**: Share responsibility before burnout
- [ ] **Reduce scope**: Cut features, simplify maintenance
- [ ] **Set boundaries**: Limit time spent per week (e.g., 5h/week max)
- [ ] **Hand off to community**: Let community maintain if they care

#### Scenario 3: Competing Library Releases Better v2

- [ ] **Adopt good ideas from competitor**: Learn and improve
- [ ] **Differentiate more clearly**: Focus on unique value (zero-deps)
- [ ] **Collaborate instead of compete**: Maybe merge projects?
- [ ] **Accept gracefully**: Their success doesn't diminish your learning

#### Scenario 4: Personal Circumstances Change (New job, family, etc.)

- [ ] **Pause development**: Clear communication about hiatus
- [ ] **Hand off to someone else**: Find new maintainer
- [ ] **Sunset gracefully**: Archive with clear migration path to alternatives
- [ ] **Keep minimal maintenance**: Security fixes only

### When to Stop Investing Time

**Set clear decision points** BEFORE starting:

**Stop Point 1: After Phase 0 (Preparation)**

- If user feedback shows no interest in v2 → Stop
- If can't find co-maintainer → Reconsider scope
- If life circumstances change → Pause or cancel

**Stop Point 2: After Alpha Release**

- If <5 alpha testers express interest → Reconsider market need
- If feedback shows fundamental design flaws → Pivot or stop
- If time investment exceeds 150% of estimate → Cut scope drastically

**Stop Point 3: After Beta Release**

- If <50 downloads/week → Low demand, consider sunsetting
- If critical bugs can't be fixed → Reconsider approach
- If burnout is setting in → Hand off or pause

**Stop Point 4: After v2.0 Launch**

- If <500 downloads/week after 6 months → Accept niche status or sunset
- If maintenance burden >10h/week → Find co-maintainer or reduce scope
- If not enjoyable anymore → It's okay to move on

### Key Questions to Answer

Before proceeding, honestly answer these:

1. **Why am I really doing this?** (The real reason, not the stated reason)
   - Answer: ******************\_******************

2. **What's the minimum success threshold that would make this worthwhile?**
   - Answer: ******************\_******************

3. **If this fails, will I regret the time spent?**
   - Answer: ******************\_******************

4. **Am I prepared to maintain this for 2+ years if it succeeds?**
   - Answer: ******************\_******************

5. **Is there a better use of 650-900 hours for my current life goals?**
   - Answer: ******************\_******************

### Recommendation

**Proceed if:**

- ✅ You checked 3+ motivations above
- ✅ You have realistic success metrics defined
- ✅ You have an exit strategy for failure scenarios
- ✅ This aligns with your 1-2 year career/life goals
- ✅ You're genuinely excited about the technical challenges

**Reconsider if:**

- ❌ Main motivation is "it would be cool"
- ❌ No clear success definition
- ❌ No plan for if it doesn't work out
- ❌ Doing it because you "should" not because you "want to"
- ❌ Better opportunities exist for your time

**This is a significant investment. Choose deliberately, not by default.**

---

## Conclusion

This **revised and focused** plan outlines a realistic path to transform fej from a simple prototype into a production-ready library. The key changes from the original plan:

### Scope Reduction: 70% Feature Cut

**Original Plan**: 30+ features
**Revised Plan**: 8-10 essential features

**What We Keep (Essential for v2.0):**

1. Named middleware with priority
2. Error handling + basic retry
3. AbortController integration
4. 3 essential middleware utilities (auth, logger, retry)
5. Modern tooling and testing
6. Comprehensive documentation
7. ONE framework integration (React)

**What We Defer (v2.1+):**

- Circuit breaker pattern
- Request deduplication
- Caching layer
- Performance monitoring
- Middleware groups
- Additional framework integrations
- Developer tooling (VS Code, DevTools)
- Advanced middleware utilities

### Realistic Timeline

**Original**: 3-5 months (300-420 hours)
**Revised**: 6-8 months (620-850 hours) with 30% buffer

### Success Criteria

All success criteria updated to be SMART (Specific, Measurable, Achievable, Relevant, Time-bound)

### Focus Areas

1. **Stability**: Fix bugs, comprehensive tests, ensure reliability
2. **Developer Experience**: Better docs, types, error messages
3. **Essential Features**: Only features that provide core value
4. **Community**: Build welcoming, sustainable community
5. **Simplicity**: Maintain the core philosophy that makes fej attractive

### Why This Approach?

- **Higher Quality**: Focus yields better implementation
- **Realistic**: Prevents burnout and missed deadlines
- **Sustainable**: Can actually be maintained long-term
- **User-Focused**: Delivers real value, not feature bloat

**Next Steps:**

1. **DO NOT START CODING YET**
2. Complete Phase 0 (Preparation):
   - Baseline measurements
   - Release v1.9 with deprecation warnings
   - User feedback collection
   - API design finalization
3. Find co-maintainer for sustainability
4. Set up project board with realistic milestones
5. Begin Phase 1 only after Phase 0 complete
6. Regular progress tracking and risk assessment

---

## Appendix: Alternatives Considered

### Option A: Minimal Update

- Fix bugs only
- Update tooling minimally
- Keep current feature set
- **Rejected**: Doesn't address competitive disadvantages

### Option B: Complete Rewrite

- Start from scratch
- Modern architecture
- All features from day one
- **Rejected**: Too risky, loses v1 users

### Option C: Merge with Another Project

- Join forces with similar library
- Combine communities
- **Rejected**: Loses unique identity

### Option D: This Plan (Evolutionary Approach) ✅

- Incremental improvements
- Backward compatible where possible
- Clear migration path
- Balanced risk/reward
