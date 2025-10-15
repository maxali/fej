# Quick Start: fej v2 Development

This guide helps you get started quickly with fej v2 development. For complete details, see the full documentation.

---

## 📖 Documentation Overview

| Document | Purpose | Audience |
|----------|---------|----------|
| [PROJECT_REVIEW.md](./PROJECT_REVIEW.md) | Current state analysis | Everyone |
| [V2_PLAN.md](./V2_PLAN.md) | Complete v2 roadmap | Stakeholders, developers |
| [V2_IMPLEMENTATION_GUIDE.md](./V2_IMPLEMENTATION_GUIDE.md) | Technical specifications | Developers |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guidelines | Contributors |
| [ROADMAP.md](./ROADMAP.md) | Long-term vision | Everyone |
| [CHANGELOG.md](./CHANGELOG.md) | Version history | Everyone |

---

## 🎯 Key Findings from Review

### ✅ Strengths
- Clean, minimal API design
- Zero dependencies
- TypeScript support
- Focused purpose

### ❌ Critical Issues
1. **Async middleware bug** (line 63) - awaits array instead of results
2. **Incorrect async declaration** (line 27) - addMiddleware shouldn't be async
3. **Outdated dependencies** - TypeScript 3.5.2, deprecated TSLint
4. **Minimal testing** - Only one basic test
5. **Type safety issues** - Uses `any` in several places

### 🎯 Assessment Score: 6/10
- Concept: 9/10 ✨
- Implementation: 5/10 ⚠️
- Testing: 2/10 ⚠️
- Documentation: 5/10 ⚠️
- Maintenance: 4/10 ⚠️

---

## 🚀 v2.0 Overview

### Goals
1. Fix all critical bugs
2. Modernize tooling
3. Achieve 80%+ test coverage
4. Improve developer experience
5. Add essential features

### Timeline: 3-5 months (part-time)

```
Phase 1: Foundation (2-3 weeks)     ████████░░░░░░░░
Phase 2: Features (3-4 weeks)       ░░░░░░░░████████░░░░
Phase 3: Ecosystem (2-3 weeks)      ░░░░░░░░░░░░░░░░████
Phase 4: Launch (1-2 weeks)         ░░░░░░░░░░░░░░░░░░░░██
```

---

## 🔧 Phase 1: Foundation (PRIORITY)

### Week 1-2: Critical Fixes
```typescript
// ❌ Current bug (line 63-64)
const mdwResults = await Promise.all(this.asyncMiddleWares);
await Promise.all(mdwResults.map(async (asyncMiddleware) => { ... }));

// ✅ Fixed version
const mdwResults = await Promise.all(
  this.asyncMiddleWares.map(asyncMiddleware => asyncMiddleware(_init))
);

// ❌ Current bug (line 27)
public addMiddleware = async (fn: IFejMiddleware) => { ... }

// ✅ Fixed version
public addMiddleware = (fn: IFejMiddleware) => { ... }
```

### Week 2-3: Modernization
- [ ] Upgrade TypeScript 3.5.2 → 5.x
- [ ] Replace TSLint → ESLint + Prettier
- [ ] Add Vitest for testing
- [ ] Set up GitHub Actions CI/CD
- [ ] Configure tsup for building

### Package Updates
```json
{
  "devDependencies": {
    "typescript": "^5.3.3",
    "eslint": "^8.55.0",
    "@typescript-eslint/parser": "^6.15.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "prettier": "^3.1.1",
    "vitest": "^1.0.4",
    "tsup": "^8.0.1"
  }
}
```

---

## 🎨 Phase 2: Core Features

### New API Design
```typescript
// v1 (backward compatible)
import Fej from 'fej';
Fej.setInit({ headers: {...} });
Fej.addMiddleware(fn);

// v2 (new API)
import { createFej } from 'fej';

const api = createFej({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

// Named middleware
api.use('auth', async (req, next) => {
  const token = await getToken();
  req.headers.set('Authorization', `Bearer ${token}`);
  await next();
  return req;
});

// Convenience methods
const users = await api.get('/users');
const user = await api.post('/users', { name: 'John' });

// Interceptors
api.intercept.response(res => {
  if (!res.ok) throw new ApiError(res);
  return res;
});

// Error handling
api.intercept.error(async (error, req) => {
  if (error.status === 401) {
    await refreshToken();
    return api.retry(req);
  }
  throw error;
});
```

---

## 📊 Testing Strategy

### Coverage Goals
- **Minimum:** 80% overall
- **Target:** 90% for new code
- **Critical paths:** 100%

### Test Structure
```typescript
describe('Fej', () => {
  describe('use()', () => {
    it('should register middleware');
    it('should execute middleware in order');
    it('should handle async middleware');
    it('should support middleware removal');
    it('should filter by path');
    it('should filter by method');
  });
  
  describe('request()', () => {
    it('should make basic requests');
    it('should apply middleware');
    it('should run interceptors');
    it('should handle errors');
    it('should support retry');
    it('should support timeout');
  });
});
```

---

## 🛠️ Development Workflow

### Initial Setup
```bash
# Clone and setup
git clone https://github.com/maxali/fej.git
cd fej
npm install

# Create feature branch
git checkout -b feature/phase1-fixes
```

### Development Cycle
```bash
# 1. Make changes
vim src/index.ts

# 2. Run tests in watch mode
npm test -- --watch

# 3. Lint and format
npm run lint
npm run format

# 4. Build
npm run build

# 5. Commit
git add .
git commit -m "fix: correct async middleware execution"

# 6. Push and create PR
git push origin feature/phase1-fixes
```

### Pre-commit Checklist
- [ ] All tests passing
- [ ] No lint errors
- [ ] Code formatted
- [ ] Types correct
- [ ] Documentation updated

---

## 📝 Documentation Requirements

### Code Documentation
```typescript
/**
 * Register a middleware function
 * 
 * @param middleware - The middleware function to register
 * @param config - Optional middleware configuration
 * @returns A unique identifier for the middleware
 * 
 * @example
 * ```typescript
 * const id = api.use((req, next) => {
 *   req.headers.set('X-Custom', 'value');
 *   return next().then(() => req);
 * });
 * ```
 */
use(middleware: Middleware, config?: MiddlewareConfig): symbol
```

### Documentation Types
1. **JSDoc** - Inline code documentation
2. **API Reference** - Generated from JSDoc
3. **Guides** - How-to articles
4. **Examples** - Real-world usage
5. **Migration** - v1 to v2 guide

---

## 🚦 Success Criteria

### Phase 1 Complete When:
- [x] All critical bugs fixed
- [x] Tests passing with modern tooling
- [x] TypeScript 5.x compiling successfully
- [x] CI/CD pipeline running
- [x] Test coverage >50%

### v2.0 Release Ready When:
- [ ] All phases complete
- [ ] Test coverage >80%
- [ ] Documentation complete
- [ ] Migration guide written
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] No critical issues

---

## 🎯 Quick Wins

Things that can be done immediately:

1. **Fix async middleware bug** (1 hour)
   ```typescript
   // Change line 63-64
   const mdwResults = await Promise.all(
     this.asyncMiddleWares.map(mw => mw(_init))
   );
   ```

2. **Remove async from addMiddleware** (5 minutes)
   ```typescript
   // Change line 27
   public addMiddleware = (fn: IFejMiddleware) => {
   ```

3. **Add skipLibCheck to tsconfig** (1 minute)
   ```json
   {
     "compilerOptions": {
       "skipLibCheck": true
     }
   }
   ```

4. **Add more tests** (2-3 hours)
   - Test middleware execution
   - Test async middleware
   - Test deep merge
   - Test error cases

5. **Update package.json scripts** (10 minutes)
   ```json
   {
     "scripts": {
       "test": "vitest",
       "test:coverage": "vitest --coverage"
     }
   }
   ```

---

## 💡 Tips for Contributors

### Getting Started
1. Read [CONTRIBUTING.md](./CONTRIBUTING.md) first
2. Look for "good first issue" labels
3. Comment on issue before starting work
4. Ask questions in GitHub Discussions

### Best Practices
- Write tests before code (TDD)
- Keep PRs small and focused
- Update docs with code changes
- Run full test suite before pushing
- Follow commit message conventions

### Common Mistakes to Avoid
- ❌ Making changes without tests
- ❌ Using `any` type
- ❌ Breaking backward compatibility
- ❌ Skipping documentation
- ❌ Not running linter

---

## 📞 Getting Help

### Questions?
- **GitHub Discussions** - General questions
- **Issues** - Bug reports, feature requests
- **PRs** - Code review and implementation help

### Resources
- TypeScript Handbook
- Vitest Documentation
- Fetch API MDN docs
- Project documentation files

---

## ⚡ Next Steps

### For Maintainers
1. Review and approve this plan
2. Create GitHub project board
3. Create issues for Phase 1 tasks
4. Set up CI/CD pipeline
5. Begin Phase 1 implementation

### For Contributors
1. Star the repository
2. Read the documentation
3. Set up development environment
4. Find a good first issue
5. Start contributing!

---

## 📊 Progress Tracking

Track progress on the [GitHub Project Board](#) (to be created)

### Current Status
```
Phase 1: Foundation         [ Not Started ]
Phase 2: Features           [ Not Started ]
Phase 3: Ecosystem          [ Not Started ]
Phase 4: Launch             [ Not Started ]
```

### Milestones
- [ ] v2.0.0-alpha - Phase 1 complete
- [ ] v2.0.0-beta - Phase 2 complete
- [ ] v2.0.0-rc - Phase 3 complete
- [ ] v2.0.0 - Phase 4 complete

---

## 🎉 Let's Build Something Great!

fej has strong potential to become the go-to middleware solution for fetch API. With focused effort on the improvements outlined in this plan, v2 can deliver:

- 🐛 **Zero critical bugs**
- ✅ **80%+ test coverage**
- 📚 **Complete documentation**
- 🚀 **Modern tooling**
- 💪 **Production-ready quality**
- 🎯 **Clear upgrade path**

**Ready to contribute?** Check out [CONTRIBUTING.md](./CONTRIBUTING.md) and dive in!

---

**Questions?** Open a GitHub Discussion or Issue.

**Want to help?** Look for issues labeled `good first issue` or `help wanted`.

**Stay updated:** Watch the repository for releases and announcements.
