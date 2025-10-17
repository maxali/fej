# First-Time Contributors Guide

Welcome to fej! 👋 We're excited that you're interested in contributing to this project. This guide will help you make your first contribution, even if you've never contributed to open source before.

---

## Table of Contents

1. [Why Contribute?](#why-contribute)
2. [What Can I Contribute?](#what-can-i-contribute)
3. [Your First Contribution](#your-first-contribution)
4. [Step-by-Step Guide](#step-by-step-guide)
5. [Getting Help](#getting-help)
6. [Common Mistakes (and How to Fix Them)](#common-mistakes-and-how-to-fix-them)

---

## Why Contribute?

Contributing to open source helps you:

- **Learn**: Improve your coding skills by working on real-world projects
- **Build Your Portfolio**: Showcase your contributions on your resume/GitHub profile
- **Meet People**: Connect with developers from around the world
- **Give Back**: Help improve tools that you and others use
- **Gain Confidence**: Build experience working with teams and codebases

---

## What Can I Contribute?

You don't need to be an expert to contribute! Here are some ways to get started:

### 1. Documentation (Great for Beginners!)

- Fix typos or unclear explanations
- Improve code examples
- Add missing documentation
- Translate documentation (future)

### 2. Code Examples

- Create examples showing how to use fej
- Add framework integration examples (React, Vue, etc.)
- Share common patterns and use cases

### 3. Bug Reports

- Report bugs you've found
- Provide detailed reproduction steps
- Help verify and test bug fixes

### 4. Bug Fixes

- Fix bugs labeled `good first issue`
- Start with small, well-defined issues
- Ask questions if you're unsure

### 5. Tests

- Add missing test cases
- Improve test coverage
- Write tests for edge cases

### 6. Feature Requests

- Suggest new features
- Discuss improvements
- Provide feedback on proposed changes

---

## Your First Contribution

### Step 1: Find a Good First Issue

Look for issues labeled:
- `good first issue` - Perfect for beginners
- `help wanted` - We'd love your help
- `documentation` - Usually easier to start with

**Can't find a suitable issue?** That's okay! You can:
- Fix a typo in the documentation
- Improve a code example
- Add a missing test case
- Ask in Discussions what would be helpful

### Step 2: Claim the Issue

Before starting work:
1. Read the issue description carefully
2. Comment on the issue: "I'd like to work on this!"
3. Wait for a maintainer to assign it to you (usually quick!)
4. Ask questions if anything is unclear

### Step 3: Do the Work

Follow the [Step-by-Step Guide](#step-by-step-guide) below.

### Step 4: Submit Your PR

Don't worry about making it perfect! We'll help you improve it through code review.

---

## Step-by-Step Guide

### Prerequisites

You'll need:
- [Git](https://git-scm.com/) installed
- [Node.js 18+](https://nodejs.org/) installed
- A [GitHub account](https://github.com)
- A text editor (VS Code, Sublime, etc.)

### 1. Fork the Repository

A "fork" is your personal copy of the project.

1. Go to [https://github.com/maxali/fej](https://github.com/maxali/fej)
2. Click the "Fork" button in the top right
3. Wait for GitHub to create your fork

### 2. Clone Your Fork

Download your fork to your computer:

```bash
# Replace YOUR_USERNAME with your GitHub username
git clone https://github.com/YOUR_USERNAME/fej.git
cd fej
```

### 3. Add the Original Repository as "Upstream"

This lets you get updates from the main project:

```bash
git remote add upstream https://github.com/maxali/fej.git
```

Verify it worked:

```bash
git remote -v
# You should see both 'origin' (your fork) and 'upstream' (main repo)
```

### 4. Install Dependencies

```bash
npm install
```

This might take a few minutes. Go grab some coffee! ☕

### 5. Create a Branch

Never work directly on `master`! Create a new branch:

```bash
# For a bug fix:
git checkout -b fix/issue-123-description

# For a feature:
git checkout -b feature/my-feature-name

# For documentation:
git checkout -b docs/improve-readme
```

### 6. Make Your Changes

Now you can:
- Edit files in your text editor
- Add new files
- Delete files
- Whatever the issue requires!

**Tips:**
- Make small, focused changes
- Don't change unrelated things
- Test as you go

### 7. Test Your Changes

**IMPORTANT**: Always run tests before submitting!

```bash
# Check if your code is formatted correctly
npm run format:check

# Fix formatting automatically
npm run format

# Check for code issues
npm run lint

# Run tests
npm test

# Check TypeScript types
npm run type-check
```

Fix any errors before continuing.

### 8. Commit Your Changes

```bash
# Add your changes
git add .

# Commit with a clear message
git commit -m "fix: resolve issue with timeout handling

Fixes timeout not being properly cleared when request completes.
Added test case to verify the fix.

Closes #123"
```

**Good commit messages:**
- Start with a type: `fix:`, `feat:`, `docs:`, `test:`, etc.
- Keep the first line short (under 50 characters)
- Explain *why* you made the change, not just *what* changed

### 9. Push to Your Fork

```bash
git push origin fix/issue-123-description
```

### 10. Create a Pull Request

1. Go to your fork on GitHub: `https://github.com/YOUR_USERNAME/fej`
2. You should see a banner saying "Compare & pull request" - click it!
3. Fill out the PR template:
   - **Title**: Clear and descriptive
   - **Description**: Explain what you changed and why
   - **Related Issue**: Mention the issue number (e.g., "Closes #123")
   - **Checklist**: Check off items as you complete them
4. Click "Create Pull Request"

🎉 **Congratulations!** You've created your first PR!

### 11. Respond to Feedback

A maintainer will review your PR. They might:
- Approve it immediately (rare for first PRs)
- Ask questions
- Request changes
- Suggest improvements

**This is normal and helpful!** Everyone's PRs get feedback.

To make changes:

```bash
# Make the requested changes
# Then commit and push again
git add .
git commit -m "address review feedback"
git push origin fix/issue-123-description
```

The PR will automatically update!

### 12. Celebrate! 🎉

Once your PR is merged:
- You're officially an open source contributor!
- Your name will be in the contributors list
- You can add this to your resume/portfolio
- Most importantly: you helped improve a project used by others!

---

## Getting Help

### Where to Ask Questions

**Before you ask:**
1. Check the [README](README.md)
2. Read [CONTRIBUTING.md](CONTRIBUTING.md)
3. Search existing issues and discussions

**Still stuck?**
- **GitHub Discussions**: Best for general questions
- **Issue Comments**: For questions about a specific issue
- **Discord**: For real-time chat (if available)

**Don't be shy!** Everyone was a beginner once. We're here to help!

### What to Include When Asking

Help us help you by providing:
- What you're trying to do
- What you've already tried
- Error messages (full text, not screenshots)
- Your environment (OS, Node.js version, etc.)

---

## Common Mistakes (and How to Fix Them)

### Mistake 1: Committing to the Master Branch

**Fix:**
```bash
# Create a new branch from master
git checkout master
git checkout -b fix/my-actual-fix

# Cherry-pick your commit
git cherry-pick <commit-hash>

# Force push to your branch
git push origin fix/my-actual-fix
```

### Mistake 2: Fork is Out of Date

**Fix:**
```bash
# Get latest changes from upstream
git fetch upstream

# Switch to master
git checkout master

# Merge upstream changes
git merge upstream/master

# Update your fork on GitHub
git push origin master
```

### Mistake 3: Tests are Failing

**Common causes:**
- Forgot to run `npm install` after pulling changes
- Code doesn't follow style guidelines (run `npm run format`)
- Breaking existing functionality (review your changes)
- Missing test cases (add tests for your changes)

**Fix:**
```bash
# Update dependencies
npm install

# Format code
npm run format

# Run tests to see what's failing
npm test

# Fix the issues, then run tests again
```

### Mistake 4: Merge Conflicts

**Fix:**
```bash
# Update your branch with latest master
git fetch upstream
git checkout your-branch-name
git rebase upstream/master

# Fix conflicts in your editor
# Look for <<<<<<, ======, >>>>>> markers

# After fixing conflicts:
git add .
git rebase --continue

# Force push (safe because it's your branch)
git push --force origin your-branch-name
```

### Mistake 5: Pushed the Wrong Thing

**Fix (if you haven't created PR yet):**
```bash
# Undo the last commit (keeps changes)
git reset HEAD~1

# Make corrections
# Then commit again properly
```

---

## Tips for Success

### ✅ Do

- **Ask questions** - It's better to ask than to guess
- **Start small** - Your first PR doesn't need to be huge
- **Read existing code** - Learn the project's style
- **Test thoroughly** - Make sure everything works
- **Be patient** - Reviews might take a few days
- **Be respectful** - We're all volunteers
- **Have fun!** - Contributing should be enjoyable

### ❌ Don't

- **Don't work on issues claimed by others** - Ask first
- **Don't make unrelated changes** - Stay focused
- **Don't skip tests** - They're there for a reason
- **Don't take feedback personally** - It's about the code, not you
- **Don't give up!** - The first contribution is the hardest

---

## Resources

### Learning Git and GitHub

- [GitHub's Git Handbook](https://guides.github.com/introduction/git-handbook/)
- [First Contributions](https://github.com/firstcontributions/first-contributions)
- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)

### Learning TypeScript

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [TypeScript in 5 Minutes](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)

### Learning Testing

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

## Next Steps

Once you've made your first contribution:

1. Look for more `good first issue` labels
2. Help other newcomers
3. Suggest improvements to this guide
4. Consider becoming a regular contributor!

---

## Final Words

Remember:
- Everyone makes mistakes (even maintainers!)
- Questions are welcome
- Your contribution matters, no matter how small
- The community is here to support you

**Welcome to the fej community!** We're glad you're here. 🎉

---

*Have questions about this guide? Feel free to ask in [GitHub Discussions](https://github.com/maxali/fej/discussions) or open an issue to suggest improvements!*
