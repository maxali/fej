---
description: Execute Phase 1 - Foundation (bug fixes, tooling, testing)
argument-hint: <task-number> (optional)
allowed-tools: Bash(npm:*), Bash(git:*)
---

# Phase 1: Foundation (5-7 weeks, 150-220 hours)

## Objectives
Fix critical bugs, modernize tooling, establish quality baseline

Use context7 mcp for documentations.

## Current Status
!`git branch --show-current`

## Tasks

### 1.1 Bug Fixes (40-60h, 2 weeks)
**Argument**: Use `/v2:phase1 1.1` to work on bug fixes

Critical bugs to fix:
- [ ] Fix async middleware execution (line 63: awaits array instead of results)
- [ ] Remove incorrect async from addMiddleware (line 27)
- [ ] Fix deep merge edge cases
- [ ] Add proper error boundaries
- [ ] All fixes have regression tests

**Current bugs identified**: See @V2_PLAN.md and @PROJECT_REVIEW.md

### 1.2 Tooling Modernization (40-60h, 2 weeks)
**Argument**: Use `/v2:phase1 1.2` to work on tooling

Tasks:
- [ ] Upgrade TypeScript 3.5.2 → 5.x
- [ ] Replace TSLint with ESLint + Prettier
- [ ] Add Vitest test runner
- [ ] Configure modern build (tsup or rollup)
- [ ] Add GitHub Actions CI/CD
- [ ] Set up automated npm publishing

### 1.3 Testing Infrastructure (50-70h, 2 weeks)
**Argument**: Use `/v2:phase1 1.3` to work on testing

NOTE: Always use context7 mcp server for library documentation
Tasks:
- [ ] Set up Vitest with coverage
- [ ] Create test utilities and helpers
- [ ] Add integration tests with local HTTP server
- [ ] Set up browser compatibility tests
- [ ] CI integration for tests

### 1.4 Type Safety (20-30h, 1 week)
**Argument**: Use `/v2:phase1 1.4` to work on types

Tasks:
- [ ] Enable TypeScript strict mode
- [ ] Remove all `any` types
- [ ] Add type tests (tsd or expect-type)
- [ ] Improve type inference

---

## Package Status
!`npm list --depth=0`

## Success Criteria (Gate 2)
- [ ] All P0/P1 bugs fixed
- [ ] Tests passing with modern tooling
- [ ] TypeScript strict mode enabled (`tsc --noEmit` exits 0)
- [ ] CI/CD running on all PRs within 5 minutes
- [ ] All Phase 1 public APIs have unit tests

**Usage**: `/v2:phase1` shows status, `/v2:phase1 1.1` works on specific task
