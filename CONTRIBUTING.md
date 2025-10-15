# Contributing to Fej

Thank you for your interest in contributing to fej! This document provides guidelines and instructions for contributing to the project.

---

## Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Making Changes](#making-changes)
5. [Submitting Changes](#submitting-changes)
6. [Coding Standards](#coding-standards)
7. [Testing Guidelines](#testing-guidelines)
8. [Documentation](#documentation)

---

## Code of Conduct

### Our Pledge
We are committed to providing a welcoming and inclusive experience for everyone. We expect all contributors to:

- Be respectful and considerate
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy toward other community members

### Unacceptable Behavior
- Harassment, discrimination, or offensive comments
- Trolling or insulting/derogatory comments
- Public or private harassment
- Publishing others' private information without permission

---

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Git
- TypeScript knowledge (for code contributions)

### Finding Issues to Work On

1. **Good First Issues**: Look for issues labeled `good first issue`
2. **Help Wanted**: Issues labeled `help wanted` are open for contribution
3. **Bug Reports**: Fix bugs labeled with `bug`
4. **Feature Requests**: Implement features labeled with `enhancement`

### Before You Start
- Check if someone is already working on the issue
- Comment on the issue to claim it
- Discuss your approach if it's a significant change
- Wait for maintainer approval before starting large changes

---

## Development Setup

### 1. Fork and Clone
```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/fej.git
cd fej
```

### 2. Add Upstream Remote
```bash
git remote add upstream https://github.com/maxali/fej.git
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Build the Project
```bash
npm run build
```

### 5. Run Tests
```bash
npm test
```

### 6. Verify Everything Works
```bash
npm run lint
npm run typecheck
npm run test:coverage
```

---

## Making Changes

### 1. Create a Branch
```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create your feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

### Branch Naming Convention
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or fixes
- `chore/` - Maintenance tasks

### 2. Make Your Changes

#### For Code Changes
- Follow the existing code style
- Write/update tests for your changes
- Ensure all tests pass
- Update documentation if needed
- Add comments for complex logic

#### For Documentation Changes
- Use clear, concise language
- Include examples where helpful
- Check for spelling and grammar
- Ensure links work correctly

### 3. Commit Your Changes

#### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Example:**
```
feat(middleware): add retry middleware

Add built-in retry middleware with exponential backoff.
Includes configurable retry attempts and delay.

Closes #123
```

### 4. Keep Your Branch Updated
```bash
# Regularly sync with upstream
git fetch upstream
git rebase upstream/main
```

---

## Submitting Changes

### 1. Run Pre-submission Checks
```bash
# Lint your code
npm run lint

# Run all tests
npm test

# Check test coverage
npm run test:coverage

# Type check
npm run typecheck

# Build to verify no errors
npm run build
```

### 2. Push Your Branch
```bash
git push origin feature/your-feature-name
```

### 3. Create a Pull Request

1. Go to your fork on GitHub
2. Click "Pull Request"
3. Select your branch
4. Fill out the PR template:
   - Clear title
   - Description of changes
   - Related issue number
   - Screenshots (if UI changes)
   - Checklist completion

### 4. PR Review Process

#### What Happens Next
- Automated tests run (CI/CD)
- Code review by maintainers
- Feedback and requested changes
- Approval and merge

#### Responding to Feedback
- Address all review comments
- Push additional commits if needed
- Mark conversations as resolved
- Be patient and professional

---

## Coding Standards

### TypeScript Guidelines

#### Type Safety
```typescript
// ✅ Good: Explicit types
function processRequest(request: FejRequest): Promise<FejResponse> {
  // ...
}

// ❌ Bad: Using any
function processRequest(request: any): Promise<any> {
  // ...
}
```

#### Naming Conventions
- **Classes**: PascalCase (`class FejRequest`)
- **Functions**: camelCase (`function deepMerge()`)
- **Constants**: UPPER_SNAKE_CASE (`const MAX_RETRIES`)
- **Interfaces**: PascalCase (`interface FejConfig`)
- **Type Aliases**: PascalCase (`type Middleware`)

#### File Structure
```typescript
// 1. Imports
import { something } from './somewhere';

// 2. Types and interfaces
export interface Config { }

// 3. Constants
const DEFAULT_TIMEOUT = 5000;

// 4. Main code
export class Fej { }

// 5. Helper functions (if private)
function helper() { }
```

### Code Style

#### Use Prettier
- Format automatically with `npm run format`
- Configuration in `.prettierrc`

#### ESLint Rules
- No console logs (use debug mode)
- No unused variables
- Explicit return types for public functions
- No `any` types

### Documentation

#### JSDoc Comments
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
 * const id = fej.use((req, next) => {
 *   req.headers.set('X-Custom', 'value');
 *   return next().then(() => req);
 * });
 * ```
 */
use(middleware: Middleware, config?: MiddlewareConfig): symbol {
  // ...
}
```

---

## Testing Guidelines

### Test Structure
```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('FeatureName', () => {
  describe('methodName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = setupTest();
      
      // Act
      const result = performAction(input);
      
      // Assert
      expect(result).toBe(expected);
    });
    
    it('should handle error case', () => {
      expect(() => dangerousAction()).toThrow();
    });
  });
});
```

### Test Coverage Requirements
- **Minimum**: 80% overall coverage
- **Target**: 90% for new code
- **Critical paths**: 100% coverage

### What to Test
- ✅ All public APIs
- ✅ Error conditions
- ✅ Edge cases
- ✅ Type safety
- ✅ Integration scenarios
- ❌ Private implementation details
- ❌ Third-party library behavior

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- src/core/fej.test.ts

# Run with coverage
npm run test:coverage
```

---

## Documentation

### Types of Documentation

#### 1. Code Comments
- Explain why, not what
- Use JSDoc for public APIs
- Keep comments up to date

#### 2. README.md
- Quick start guide
- Basic examples
- Installation instructions

#### 3. API Documentation
- Generated from JSDoc
- Complete parameter descriptions
- Usage examples

#### 4. Guides and Tutorials
- Step-by-step instructions
- Real-world examples
- Best practices

### Writing Good Documentation

#### Be Clear and Concise
```markdown
// ❌ Bad
The `use` function is a method that can be utilized to incorporate middleware 
into the processing pipeline for the purpose of modifying requests.

// ✅ Good
Register a middleware function to modify requests before they're sent.
```

#### Include Examples
```markdown
## Authentication

Add a bearer token to all requests:

```typescript
fej.use(async (req, next) => {
  const token = await getAuthToken();
  req.headers.set('Authorization', `Bearer ${token}`);
  await next();
  return req;
});
```
```

#### Keep It Updated
- Update docs with code changes
- Remove outdated information
- Fix broken links

---

## PR Checklist

Before submitting your PR, ensure:

- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] Branch is up to date with main
- [ ] No merge conflicts
- [ ] PR description is complete
- [ ] Related issue is referenced
- [ ] Screenshots included (if UI changes)
- [ ] Breaking changes are documented

---

## Getting Help

### Where to Ask Questions
- **GitHub Discussions**: General questions and ideas
- **Issue Comments**: Specific issue-related questions
- **Discord**: Real-time chat (if available)

### When to Open an Issue
- **Bug reports**: Something doesn't work
- **Feature requests**: New functionality ideas
- **Documentation issues**: Unclear or missing docs
- **Questions**: If Discussions isn't available

---

## Release Process

### For Maintainers Only

1. **Update version**: `npm version [major|minor|patch]`
2. **Update CHANGELOG.md**: Document all changes
3. **Create release branch**: `git checkout -b release/v2.0.0`
4. **Run full test suite**: Ensure everything passes
5. **Build**: `npm run build`
6. **Publish**: `npm publish`
7. **Create GitHub release**: Tag and release notes
8. **Announce**: Blog, Twitter, etc.

---

## Recognition

### Contributors
All contributors are recognized in:
- README.md contributors section
- GitHub contributors page
- Release notes

### Significant Contributions
Maintainer status considered for:
- Multiple quality PRs
- Consistent involvement
- Community support
- Code reviews

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (ISC License).

---

## Questions?

If you have questions not covered here:
1. Check existing documentation
2. Search closed issues
3. Ask in Discussions
4. Open an issue

Thank you for contributing to fej! 🎉
