# fej v2.0 Decision Log

This document tracks all major architectural and design decisions made during the development of fej v2.0.

## Purpose

- Document **why** decisions were made, not just **what** was decided
- Provide context for future maintainers
- Track reversibility and consequences of decisions
- Enable learning from past choices

## Format

Each decision follows this template:

```markdown
## Decision: [Title]

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Rejected | Superseded
**Deciders:** [Names/GitHub handles]

### Context

What problem are we solving? What constraints exist?

### Options Considered

1. **Option A**: Description
   - Pros: ...
   - Cons: ...
   - Estimated effort: ...

2. **Option B**: Description
   - Pros: ...
   - Cons: ...
   - Estimated effort: ...

### Decision

We chose **Option X** because...

### Consequences

**Positive:**

- ...
- ...

**Negative:**

- ...
- ...

**Risks:**

- ...
- ...

### Reversibility

- Can this be reversed? Yes/No
- If yes, how and at what cost?
- What would trigger reversal?

### Follow-up Actions

- [ ] Action 1
- [ ] Action 2
```

---

## Decisions

### Decision: 70% Feature Scope Reduction for v2.0

**Date:** 2025-10-16
**Status:** ✅ Accepted
**Deciders:** Project maintainer (based on Critical Review)

#### Context

Original v2.0 plan included 30+ features (circuit breaker, caching, deduplication, monitoring, VS Code extension, etc.). This created severe scope creep that would:

- Take 12-18 months instead of 3-5 months
- Cause maintainer burnout (single maintainer)
- Compromise quality (trying to do too much)
- Conflict with "simplicity" goal

**Critical Review Finding:** "Scope creep is #1 reason projects fail. Ship something great, not everything mediocre."

#### Options Considered

1. **Option A: Original Scope (30+ features)**
   - Pros: Feature-complete, competitive with axios
   - Cons: 12-18 months, burnout risk, quality issues, conflicts with simplicity
   - Estimated effort: 1100-1500 hours

2. **Option B: Reduced Scope (8-10 essential features)** ✅ CHOSEN
   - Pros: Realistic 6-8 months, sustainable, high quality, maintains simplicity
   - Cons: Fewer features at launch, requires v2.1+ for advanced features
   - Estimated effort: 620-850 hours

3. **Option C: Find co-maintainer and keep full scope**
   - Pros: Can handle more features, shared burden
   - Cons: Hard to find qualified co-maintainer, coordination overhead
   - Estimated effort: 900-1200 hours (still long)

#### Decision

We chose **Option B: Reduced Scope (8-10 essential features)** because:

1. **Realistic timeline:** 6-8 months is achievable vs 12-18 months
2. **Single maintainer sustainability:** 620-850 hours at 25-30h/week is sustainable
3. **Higher quality:** Focus on fewer features = better implementation and testing
4. **Iterative delivery:** Ship v2.0 MVP, then add features in v2.1+
5. **Maintains simplicity:** Core philosophy intact with fewer features

**Essential features kept:**

- Named middleware with priority ordering
- Error handling + basic retry
- AbortController integration
- 3 middleware utilities (auth, logger, retry)
- Modern tooling and testing
- Comprehensive documentation
- React hooks integration (1 framework only)

**Deferred to v2.1+:**

- Circuit breaker → v2.2 as `@fej/plugin-circuit-breaker`
- Advanced caching → v2.2 as `@fej/plugin-cache`
- Request deduplication → v2.3+
- Performance monitoring → v2.2+
- Vue/Svelte/Angular integrations → v2.3+ (community)
- Developer tooling (VS Code, DevTools) → v2.4+

#### Consequences

**Positive:**

- Realistic delivery timeline (6-8 months vs 12-18 months)
- Sustainable workload for single maintainer
- Higher quality implementation and testing
- Maintains fej's simplicity philosophy
- Faster time to market
- Can iterate based on user feedback

**Negative:**

- Fewer features at v2.0 launch
- May disappoint users expecting all features
- Need to communicate "v2.1 coming soon" for advanced features
- Potential perception as "incomplete"

**Risks:**

- Users may choose competitor with more features
  - Mitigation: Focus on quality and zero-dependency advantage
- Community may be disappointed
  - Mitigation: Clear communication about roadmap and v2.1 timeline

#### Reversibility

- **Can be reversed:** No - once v2.0 ships with reduced scope, can't go back
- **Can be extended:** Yes - v2.1, v2.2, v2.3 will add deferred features
- **Cost of reversal:** Would require delaying v2.0 by 6-9 months (not realistic)

#### Follow-up Actions

- [x] Update V2_PLAN.md with reduced scope
- [x] Update V2_IMPLEMENTATION_GUIDE.md with essential features only
- [x] Create v2.1+ roadmap for deferred features
- [ ] Communicate scope reduction in v1.9 deprecation release
- [ ] Set expectations in v2.0-alpha announcement

---

### Decision: Zero Production Dependencies (Strict Policy)

**Date:** 2025-10-16
**Status:** ✅ Accepted
**Deciders:** Project maintainer

#### Context

Several proposed v2.0 features conflict with "zero production dependencies" goal:

- Runtime type validation → requires Zod/Yup (~50-100KB) or custom implementation (2-3KB)
- Circuit breaker → requires opossum/cockatiel (~20-30KB) or custom implementation (3-5KB)
- Advanced caching → requires lru-cache (~5-10KB) or custom implementation (2-4KB)
- Request deduplication → complex implementation (1-2KB)

**Core Identity:** Zero dependencies is a major differentiator and marketing advantage.

#### Options Considered

1. **Option A: Strict Zero Dependencies** ✅ CHOSEN
   - Pros: Core identity maintained, smaller bundle, no supply chain risk, faster installs
   - Cons: Must drop/defer features that need dependencies
   - Result: `package.json dependencies: {}`

2. **Option B: Allow Dependencies for Complex Features**
   - Pros: Can include circuit breaker, caching, validation
   - Cons: Loses "zero dependencies" marketing claim, bundle size grows
   - Result: ~3-5 production dependencies, +30-50KB bundle size

3. **Option C: Plugin Architecture with Peer Dependencies**
   - Pros: Core stays zero-dependency, power users can opt-in
   - Cons: More complex architecture, fragmented ecosystem
   - Result: Core: 0 deps, Plugins: peer deps (user's choice)

#### Decision

We chose **Option A: Strict Zero Dependencies** for v2.0 core with **Option C: Plugin Architecture** for v2.2+ advanced features.

**v2.0 Core (Zero Dependencies):**

- ✅ All features use ONLY native APIs (fetch, Headers, AbortController, Map, etc.)
- ❌ NO runtime type validation (users handle with their preferred library)
- ❌ NO circuit breaker (deferred to v2.2+ plugin)
- ❌ NO advanced caching (deferred to v2.2+ plugin)
- ❌ NO request deduplication (deferred to v2.3+)

**v2.2+ Plugins (Optional Peer Dependencies):**

```json
// Core stays clean
"dependencies": {}

// Optional plugins (user's choice)
@fej/plugin-cache → peer: lru-cache
@fej/plugin-circuit-breaker → peer: opossum
@fej/plugin-validation → peer: zod
```

#### Consequences

**Positive:**

- **Core identity maintained:** "Zero dependencies" remains true and marketable
- **Smaller bundle:** 8-10KB realistic vs 15-20KB with dependencies
- **No supply chain attacks:** No dependencies = no vulnerability risks
- **Faster installs:** No dependency tree to resolve
- **Fully auditable:** All code is in fej repository
- **Predictable behavior:** No dependency version conflicts

**Negative:**

- **Fewer features in v2.0:** No circuit breaker, advanced cache, validation
- **Plugin complexity:** v2.2+ requires plugin architecture (more code)
- **User friction:** Power users must manually install plugins
- **Ecosystem fragmentation:** Plugins may not be maintained

**Risks:**

- Users may choose competitors with built-in features
  - Mitigation: Emphasize bundle size, security, and simplicity advantages
- Plugins may not be adopted
  - Mitigation: Quality official plugins, clear documentation

#### Reversibility

- **Can be reversed:** Yes, but at great cost (lose core identity)
- **Cost:** Lose "zero dependencies" marketing claim, bundle size increase
- **Trigger:** If zero-dependency policy becomes a major adoption blocker

#### Follow-up Actions

- [x] Remove runtime validation from Phase 1.4
- [x] Remove circuit breaker from Phase 2
- [x] Remove advanced caching from Phase 2
- [x] Document alternatives for v2.0 users in implementation guide
- [ ] Design plugin architecture for v2.2+
- [ ] CI check to enforce empty dependencies field
- [ ] Add "Zero Dependencies" badge to README

---

### Decision: Unified Middleware Model (No Interceptors)

**Date:** 2025-10-16
**Status:** ✅ Accepted
**Deciders:** Project maintainer (based on Critical Review Point 3)

#### Context

Original v2.0 architecture had **three overlapping concepts:**

1. Middleware (pre-request transformation)
2. Interceptors (request + response transformation)
3. Hooks (lifecycle events)

**Critical Review Finding:** "Middleware vs Interceptors vs Hooks - overlapping concepts with unclear boundaries. Confused developers won't adopt your library."

Users would ask:

- What's the difference between middleware and interceptors?
- When should I use one vs the other?
- Can they conflict?
- What's the execution order?

#### Options Considered

1. **Option A: Middleware + Interceptors + Hooks (Original)**
   - Pros: Familiar to axios users, flexible
   - Cons: Confusing, complex, hard to learn, 3 mental models
   - API surface: Large (multiple registration methods)

2. **Option B: Unified Middleware Model (Koa-style)** ✅ CHOSEN
   - Pros: One concept, proven pattern, simple, flexible enough
   - Cons: Different from axios (learning curve for axios users)
   - API surface: Small (single `use()` method)

3. **Option C: Separate Request/Response Handlers**
   - Pros: Clear separation, simple
   - Cons: Less flexible, can't handle both phases in one function
   - API surface: Medium (2 methods)

#### Decision

We chose **Option B: Unified Middleware Model** inspired by Koa.js because:

1. **Simpler mental model:** One concept instead of three
2. **Proven pattern:** Koa has used this successfully for years
3. **Flexible:** Can handle request, response, and errors in one function
4. **Predictable:** Clear execution order (priority → registration → reverse)
5. **Easy to learn:** Familiar pattern for Node.js developers

**Execution Model (Onion/Stack):**

```typescript
// Middleware executes in order, then backwards
api.use('auth', async (request, next) => {
  // 1. Request phase (runs first)
  request.headers.set('Authorization', token);

  // 2. Call next middleware
  await next();

  // 3. Response phase (runs after fetch, in reverse order)
  console.log('Request completed');
  return request;
});
```

**What Was Removed:**

- ❌ `api.intercept.request(fn)` → Use `api.use(fn)`
- ❌ `api.intercept.response(fn)` → Use `api.use(fn)` with post-next logic
- ❌ `api.intercept.error(fn)` → Use `api.use(fn)` with try/catch
- ❌ Separate hooks system → Use middleware

#### Consequences

**Positive:**

- **Simpler API:** Single `use()` method instead of 5+ methods
- **Easier to learn:** One pattern to understand
- **More flexible:** Middleware can handle all phases
- **Less code:** Smaller implementation, easier to maintain
- **Clear execution:** Priority-based, then registration order

**Negative:**

- **Different from axios:** axios users need to learn new pattern
- **Async required:** All middleware must be async (use `await next()`)
- **Less explicit:** Request/response phases not separated visually

**Risks:**

- axios users may be confused initially
  - Mitigation: Clear migration guide with axios → fej examples
  - Mitigation: Documentation explains Koa-style pattern

#### Reversibility

- **Can be reversed:** Yes, but breaking change (not recommended)
- **Cost:** API redesign, documentation rewrite, user confusion
- **Trigger:** If Koa-style pattern proves too confusing in beta testing

#### Follow-up Actions

- [x] Remove interceptor types from V2_IMPLEMENTATION_GUIDE.md
- [x] Update architecture diagram to show unified middleware
- [x] Simplify Fej class to remove interceptor managers
- [ ] Write clear documentation on middleware execution model
- [ ] Create examples showing common patterns (auth, logging, error handling)
- [ ] Test with beta users to validate simplicity

---

### Decision: Realistic Bundle Size Target (<10KB, not <5KB)

**Date:** 2025-10-16
**Status:** ✅ Accepted
**Deciders:** Project maintainer (based on Critical Review Point 4)

#### Context

Original plan set bundle size target at **<5KB minified** with 30+ features.

**Critical Review Finding:** "Bundle size target <5KB is mathematically impossible with 30+ features."

**Reality Check:**

- v1: ~3KB minified (minimal features)
- Each new feature: 0.5-2KB (implementation + error handling + types)
- 8-10 features × 0.8KB average = 6.4-8KB additional
- Realistic v2 with 8-10 features: **8-10KB minified**

**Competitor Comparison:**

- fetch (native): 0KB
- wretch: 6KB
- ky: 8KB
- fej v1: 3KB
- axios: 13KB

#### Options Considered

1. **Option A: Keep <5KB Target (Impossible)**
   - Pros: Great marketing claim
   - Cons: Mathematically impossible, will fail CI, false advertising
   - Reality: Would need to cut to 2-3 features only

2. **Option B: No Bundle Size Limit**
   - Pros: No constraints, can add any feature
   - Cons: Bundle could grow to 15-20KB, lose competitive advantage
   - Reality: Would bloat over time

3. **Option C: Realistic <10KB Target with Tree-Shaking** ✅ CHOSEN
   - Pros: Achievable, competitive, allows 8-10 features
   - Cons: Larger than v1, may disappoint some users
   - Reality: 8-10KB typical usage, competitive with ky (8KB)

4. **Option D: Modular Architecture with Per-Feature Budgets**
   - Pros: Core <5KB, plugins add size only if imported
   - Cons: Complex build setup, fragmented imports
   - Reality: Could explore for v2.2+

#### Decision

We chose **Option C: Realistic <10KB Target** with per-feature budgets and tree-shaking.

**Bundle Size Targets:**

```json
{
  "Full library (all features)": "<10KB minified + gzipped",
  "Typical usage (core + 3 utils)": "<8KB minified + gzipped",
  "Core only (minimal)": "<5KB minified + gzipped"
}
```

**Per-Feature Budget:**

- 8-10 features in v2.0
- 10KB total / 10 features = ~1KB per feature
- CI enforces this with automated checks

**Enforcement:**

- `size-limit` package in CI
- Fails build if limits exceeded
- PR comments show size impact
- `npm run size:why` to analyze contributors

#### Consequences

**Positive:**

- **Achievable target:** 8-10KB is realistic with 8-10 features
- **Competitive:** Smaller than axios (13KB), comparable to ky (8KB)
- **Automated enforcement:** CI prevents bundle size regressions
- **Per-feature accountability:** Each feature has budget
- **Tree-shaking support:** Users can import only what they need

**Negative:**

- **Larger than v1:** v2 will be 2-3x larger than v1 (3KB → 8-10KB)
- **Marketing challenge:** Can't claim "<5KB" anymore
- **Feature constraints:** Each feature limited to ~1KB

**Risks:**

- Users may perceive as "bloated" vs v1
  - Mitigation: Communicate feature additions justify size increase
  - Mitigation: Tree-shaking allows minimal usage to stay ~5-6KB
- May still exceed 10KB with 10 features
  - Mitigation: Per-feature budget enforced, cut features if needed

#### Reversibility

- **Can be reversed:** Yes, can tighten limits later (but not loosen)
- **Cost:** Would require removing features or aggressive optimization
- **Trigger:** If beta testing shows bundle size is adoption blocker

#### Follow-up Actions

- [x] Update V2_PLAN.md with realistic <10KB target
- [x] Add .size-limit.json configuration
- [x] Update CI to run size checks on every PR
- [ ] Set up PR comments with bundle size comparison
- [ ] Document tree-shaking usage in README
- [ ] Create size optimization guide for contributors

---

## Decision Template (Copy for New Decisions)

```markdown
### Decision: [Title]

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Rejected | Superseded
**Deciders:** [Names]

#### Context

What problem are we solving?

#### Options Considered

1. **Option A**:
   - Pros: ...
   - Cons: ...
   - Estimated effort: ...

#### Decision

We chose **Option X** because...

#### Consequences

**Positive:**

- ...

**Negative:**

- ...

**Risks:**

- ...

#### Reversibility

- Can be reversed: Yes/No
- Cost: ...

#### Follow-up Actions

- [ ] Action 1
```

---

## Index of Decisions

Quick reference to all decisions:

1. **[70% Feature Scope Reduction](#decision-70-feature-scope-reduction-for-v20)** - Accepted ✅
2. **[Zero Production Dependencies](#decision-zero-production-dependencies-strict-policy)** - Accepted ✅
3. **[Unified Middleware Model](#decision-unified-middleware-model-no-interceptors)** - Accepted ✅
4. **[Realistic Bundle Size Target](#decision-realistic-bundle-size-target-10kb-not-5kb)** - Accepted ✅

---

## Usage Guidelines

**When to Add a Decision:**

- Major architectural changes
- Breaking API changes
- Significant feature additions or removals
- Technology or tooling choices
- Process changes that affect contributors

**When NOT to Add a Decision:**

- Bug fixes (use commit messages)
- Documentation updates
- Minor refactoring
- Implementation details (use code comments)

**Review Process:**

1. Propose decision in GitHub Discussion or Issue
2. Gather feedback from community (if applicable)
3. Document decision here with all context
4. Update status to "Accepted" or "Rejected"
5. Link to decision in relevant PRs
