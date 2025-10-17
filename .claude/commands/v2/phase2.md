---
description: Execute Phase 2 - Core Features (8-10 essential features only)
argument-hint: <task-number> (optional)
---

IMPORTANT: Do your research and use context7 MCP and search tool to read documentation.

# Phase 2: Core Features (6-8 weeks, 220-300 hours)

## Scope: Essential Features Only (70% reduction applied)

**What's IN v2.0:**
✅ Named middleware with priority
✅ Error handling + basic retry
✅ AbortController integration
✅ 3 middleware utilities (auth, logger, retry)

**What's DEFERRED to v2.1+:**
❌ Circuit breaker
❌ Caching layer
❌ Request deduplication
❌ Performance monitoring
❌ Additional utilities

## Tasks

### 2.1 Middleware Management (50-70h, 2 weeks)
**Argument**: `/v2:phase2 2.1`

Tasks:
- [ ] Named middleware: `api.use('name', fn)`
- [ ] Middleware priority/ordering system
- [ ] Remove middleware by name or ID
- [ ] Middleware execution pipeline (Koa-style onion)
- [ ] Comprehensive tests for all scenarios

### 2.2 Error Handling & Retry (50-70h, 2 weeks)
**Argument**: `/v2:phase2 2.2`

Tasks:
- [ ] Error middleware support
- [ ] Basic retry (attempts, delay, exponential backoff)
- [ ] Timeout handling with AbortController
- [ ] Error transformation hooks
- [ ] Tests for error scenarios

### 2.3 AbortController Integration (30-40h, 1 week)
**Argument**: `/v2:phase2 2.3`

Tasks:
- [ ] Request cancellation API
- [ ] Timeout with abort
- [ ] Cancel specific or all pending requests
- [ ] Tests for cancellation scenarios

### 2.4 Essential Middleware Utilities (60-80h, 2 weeks)
**Argument**: `/v2:phase2 2.4`

Tasks:
- [ ] Bearer token middleware (authentication)
- [ ] Logger middleware (debugging)
- [ ] Basic retry middleware (resilience)
- [ ] Documentation and examples for each
- [ ] Tests for each utility

### 2.5 Integration & Polish (30-40h, 1 week)
**Argument**: `/v2:phase2 2.5`

Tasks:
- [ ] Integration tests for all features working together
- [ ] Performance testing against baseline
- [ ] Bundle size validation (<10KB with size-limit)
- [ ] Type definitions review
- [ ] API documentation

---

## Success Criteria (Gate 3)
- [ ] All 8-10 features implemented
- [ ] All public APIs tested with 3+ cases each
- [ ] Bundle size <10KB verified
- [ ] Performance targets met (≤v1 overhead)
- [ ] No scope creep occurred

**Usage**: `/v2:phase2` shows status, `/v2:phase2 2.1` works on specific task
