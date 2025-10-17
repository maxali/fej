---
description: Fix a specific critical bug from Phase 1
argument-hint: <async|addmiddleware|deepmerge|errors>
allowed-tools: Read, Edit, Write, Bash(npm:*)
---

# Fix Critical Bug: $ARGUMENTS

Based on the critical review and PROJECT_REVIEW.md, these bugs need fixing:

## Available Bug Fixes

### 1. async-middleware
**Command**: `/v2:fix-bug async-middleware`
**Issue**: Line 63-64 awaits array instead of middleware results
**File**: src/index.ts:63-64
**Fix**: Change to `await Promise.all(this.asyncMiddleWares.map(mw => mw(_init)))`

### 2. addmiddleware
**Command**: `/v2:fix-bug addmiddleware`
**Issue**: Line 27 incorrectly declares async
**File**: src/index.ts:27
**Fix**: Remove `async` keyword from `addMiddleware` declaration

### 3. deepmerge
**Command**: `/v2:fix-bug deepmerge`
**Issue**: Deep merge edge cases not handled
**File**: src/utils/merge.ts (or wherever deep merge is)
**Fix**: Add proper null checks, array handling, circular reference detection

### 4. error-boundaries
**Command**: `/v2:fix-bug error-boundaries`
**Issue**: No proper error boundaries
**Fix**: Add try/catch blocks, error transformation, proper error types

---

## Process for Bug Fix

1. **Read the buggy code**
   - Locate the exact file and line
   - Understand current implementation
   - Review related tests (if any)

2. **Implement the fix**
   - Apply the correction
   - Add proper error handling
   - Maintain backward compatibility where possible

3. **Write regression test**
   - Create test file if missing
   - Add test that would have caught this bug
   - Verify test fails without fix, passes with fix

4. **Verify the fix**
   - Run tests: `npm test`
   - Check types: `npm run typecheck`
   - Verify no new issues introduced

5. **Document the change**
   - Update CHANGELOG.md
   - Add code comments explaining the fix
   - Update docs if API changed

---

**Which bug would you like to fix?** Specify: `/v2:fix-bug <bug-name>`

**Available bugs:**
- `async-middleware` - Fix async middleware execution
- `addmiddleware` - Remove incorrect async
- `deepmerge` - Fix deep merge edge cases
- `error-boundaries` - Add proper error handling
