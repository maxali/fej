# GitHub Discussion Templates for v2 Migration

These templates should be used when creating GitHub Discussions for the v2 migration.

---

## Template 1: v2.0 Announcement Discussion

**Title:** 🚀 fej v2.0 is Coming - Announcement & Discussion

**Category:** Announcements

**Content:**

```markdown
# fej v2.0 is Coming! 🚀

We're excited to announce that **fej v2.0** is in active development! This major release brings significant improvements while maintaining the core philosophy of simplicity and zero dependencies.

## 📋 Quick Summary

- **v1.9 Available NOW**: Update to see deprecation warnings
- **v2.0-alpha**: ~2 months from now (invite-only testing)
- **v2.0 Stable**: ~6 months from now

## ✨ What's New in v2?

### Key Features

- ✅ **Named middleware** with priority ordering
- ✅ **Instance-based configuration** (multiple independent instances)
- ✅ **Unified API** - Single `use()` method replaces separate sync/async methods
- ✅ **Error handling & retry** - Built-in retry logic and error middleware
- ✅ **Request cancellation** - AbortController integration
- ✅ **Modern tooling** - TypeScript 5.x strict mode, Vitest, ESLint
- ✅ **Comprehensive testing** - 100% public API coverage
- ✅ **Still zero dependencies** and small bundle (<10KB)

### Breaking Changes

- Singleton pattern removed → Use `createFej()` instead
- `addMiddleware()` + `addAsyncMiddleware()` → Unified `use()`
- `setInit()` → Constructor configuration
- New middleware signature with `next()` function
- Node.js 18+ required

## 📖 Resources

- **[Full Announcement](./V2_ANNOUNCEMENT.md)** - Detailed overview
- **[Migration Guide](./MIGRATION_GUIDE_V2.md)** - How to upgrade from v1
- **[V2 Plan](./V2_PLAN.md)** - Complete technical roadmap
- **[User Survey](./V2_USER_FEEDBACK_SURVEY.md)** - Help shape v2!

## 🗣️ Discussion Topics

We'd love to hear from you:

### 1. Feedback on Proposed Changes

- What do you think of the new API design?
- Are there any breaking changes that concern you?
- Any features you're excited about?

### 2. Migration Concerns

- What would make migration easier for you?
- How much time can you dedicate to migrating?
- Any deal-breakers we should know about?

### 3. Feature Priorities

- Which features are most important to you?
- Anything missing from the v2 plan?
- What should we prioritize for v2.1+?

### 4. Alpha/Beta Testing

- Interested in testing v2 early? Comment below!
- Share your use case and environment

## 📊 User Survey

Please take 10-15 minutes to fill out our [user feedback survey](./V2_USER_FEEDBACK_SURVEY.md). Your input directly shapes v2!

## 🙏 How You Can Help

1. ⭐ **Star the repo** if you're excited about v2
2. 💬 **Share your thoughts** in this discussion
3. 📝 **Fill out the survey** to provide detailed feedback
4. 🧪 **Sign up for alpha/beta testing** (comment below)
5. 📢 **Spread the word** to other fej users

## 🔔 Stay Updated

- Watch this repository for updates
- Check back for progress updates every 2-4 weeks
- v2 timeline will be posted in this discussion

---

**Questions?** Ask anything in the comments below!

**Found an issue?** Open a [GitHub Issue](https://github.com/maxali/fej/issues) with the `v2` label.

Thank you for being part of the fej community! 🎉
```

---

## Template 2: v2 Alpha Sign-up Discussion

**Title:** 🧪 v2.0 Alpha Testing Sign-up

**Category:** Q&A

**Content:**

```markdown
# Sign Up for v2.0 Alpha Testing 🧪

**v2.0-alpha will be available in ~2 months** for invite-only testing.

We're looking for **10-20 alpha testers** to help validate the new API and catch issues early.

## What is Alpha Testing?

**Alpha phase characteristics:**

- ⚠️ **Expect bugs** - This is early testing
- 🔄 **API may change** - Feedback shapes the final API
- 📝 **Active communication** - Weekly check-ins
- ⏱️ **Time commitment** - ~3-5 hours over 1 month

**You'll get:**

- ✅ Early access to v2 features
- ✅ Direct influence on API design
- ✅ Priority support during testing
- ✅ Credit in v2.0 release notes

## Ideal Alpha Testers

We're looking for testers with:

- ✅ **Diverse use cases** (browser, Node.js, different frameworks)
- ✅ **Active communication** (respond to questions, report bugs)
- ✅ **Real projects** (test with actual code, not just toy examples)
- ✅ **Time availability** (able to migrate and test within 1 month)

## How to Sign Up

**Comment below with:**

1. **Your use case**: What project(s) would you test v2 with?
2. **Environment**: Browser? Node.js? Framework?
3. **Availability**: Can you commit to testing within 1 month?
4. **Contact**: Email address for alpha invite

**Example:**
```

Use case: Production React app with 30+ API endpoints
Environment: Browser (React 18, TypeScript)
Availability: Yes, can test within 1 month
Contact: user@example.com

````

## Timeline

- **Now**: Sign up in this thread
- **~2 months**: v2.0-alpha release to selected testers
- **Alpha period**: 1 month of testing with weekly check-ins
- **After alpha**: v2.0-beta (public release)

## Questions?

Ask anything about alpha testing in the comments below!

---

**Already using fej v1?** Update to v1.9 now to see deprecation warnings and prepare for v2:
```bash
npm install fej@1.9.0
````

Thank you for helping make v2 great! 🙏

````

---

## Template 3: v2 Migration Help Discussion

**Title:** 💬 v2 Migration Questions & Help

**Category:** Q&A

**Content:**

```markdown
# v2 Migration Questions & Help 💬

**Preparing to migrate from v1 to v2?** Ask questions here!

## Quick Links

- **[Migration Guide](./MIGRATION_GUIDE_V2.md)** - Complete guide with examples
- **[V2 Announcement](./V2_ANNOUNCEMENT.md)** - What's changing and why
- **[V2 Plan](./V2_PLAN.md)** - Technical details

## Common Questions

### Q: When should I migrate?
**A:** Wait for v2.0-beta or v2.0-rc for stability. Update to v1.9 now to see warnings.

### Q: How long does migration take?
**A:**
- Small project (<10 files): 1-2 hours
- Medium project (10-50 files): 3-6 hours
- Large project (50+ files): 1-2 days

Using the automated codemod reduces time by 50-80%.

### Q: Will my v1 code break?
**A:** Your v1 code will continue working in v2.0 with deprecation warnings. Compatibility layer removed in v2.1+.

### Q: Is there an automated migration tool?
**A:** Yes! A codemod will be available with v2.0-alpha that handles 80%+ of common migrations automatically.

## Ask Your Question

Before posting:
1. Check the [Migration Guide](./MIGRATION_GUIDE_V2.md)
2. Search existing comments in this thread
3. Provide code examples when possible

**Format your question:**
````

## Question: [Brief title]

**v1 code:**
[paste your v1 code]

**What I'm trying to do:**
[describe your use case]

**What I've tried:**
[any migration attempts]

```

## Share Migration Tips

Already migrated? Share tips to help others:
- Migration time for your project
- Gotchas you encountered
- Helpful patterns you discovered

---

**Response time:** We aim to respond within 48 hours. Migration blockers get 24-hour priority.

**Found a bug?** Open a [GitHub Issue](https://github.com/maxali/fej/issues) with label `v2-migration-blocker`.
```

---

## Template 4: v2 Feature Requests Discussion

**Title:** 💡 v2.1+ Feature Requests

**Category:** Ideas

**Content:**

```markdown
# v2.1+ Feature Requests 💡

**v2.0 scope is locked** (focusing on quality over quantity), but we're collecting ideas for v2.1+!

## What's Already Planned

### v2.0 (Current focus)

- ✅ Named middleware with priority
- ✅ Instance-based configuration
- ✅ Error handling & retry
- ✅ Request cancellation
- ✅ Essential middleware utilities (auth, logger, retry)

### Likely v2.1+

- Circuit breaker pattern
- Request deduplication
- Vue composables
- Svelte stores
- Additional middleware utilities

## Request a Feature

**Before posting:**

1. Check if it's already listed above
2. Search existing comments
3. Check the [V2 Plan](./V2_PLAN.md) deferred features section

**Format your request:**
```

## Feature: [Name]

**Problem it solves:**
[describe the problem]

**Proposed solution:**
[how would this work?]

**Use case:**
[real-world example]

**Alternatives considered:**
[other ways to solve this]

**Willing to contribute?**

- [ ] Yes, I can implement this
- [ ] Yes, I can help test
- [ ] No, but I'd use it

```

## Vote on Features

👍 React to feature requests you want! We'll prioritize based on community interest.

## Community Plugins

Can't wait for official support? Consider building it as a community plugin!

We'll help promote quality community plugins in our documentation.

---

**Remember:** v2.0 focuses on essential features done right. Complex features may be deferred to v2.2+ or offered as optional plugins.
```

---

## Template 5: Weekly v2 Progress Update

**Title:** 📊 v2 Progress Update - Week [X]

**Category:** Announcements

**Content:**

```markdown
# v2 Progress Update - Week [X] 📊

**Date:** [YYYY-MM-DD]
**Phase:** [Current phase - e.g., "Phase 1: Foundation"]
**Target:** [Next milestone - e.g., "v2.0-alpha in 6 weeks"]

## This Week's Progress

### ✅ Completed

- [Task 1 description]
- [Task 2 description]
- [Task 3 description]

### 🚧 In Progress

- [Task 1 description - X% complete]
- [Task 2 description - X% complete]

### 📋 Next Week

- [Task 1 description]
- [Task 2 description]

## Metrics

- **Lines of code:** [number] (+X from last week)
- **Tests written:** [number] (+X from last week)
- **Test coverage:** X%
- **Bundle size:** XKB (target: <10KB)
- **Time spent this week:** X hours

## Highlights

[1-2 paragraph summary of significant progress or decisions]

## Challenges

[Any blockers or challenges encountered]

## Community

- **GitHub stars:** [current count]
- **Survey responses:** [count]/10 target
- **Alpha sign-ups:** [count]
- **Active discussions:** [count]

## Timeline Update

**Unchanged** / **Adjusted** - [explanation if changed]

- v2.0-alpha: [date estimate]
- v2.0-beta: [date estimate]
- v2.0 stable: [date estimate]

## How You Can Help

- [Specific asks for the community this week]

---

**Next update:** [Date of next weekly update]

**Questions?** Ask in the comments!

**Track detailed progress:** See [V2_PLAN.md](./V2_PLAN.md)
```

---

## Setting Up GitHub Discussions

### Step 1: Enable Discussions

1. Go to repository Settings
2. Scroll to "Features" section
3. Check "Discussions"

### Step 2: Create Categories

**Recommended categories:**

1. **📢 Announcements** - Official updates (maintainers only)
2. **💡 Ideas** - Feature requests and suggestions
3. **🙏 Q&A** - Questions and help
4. **🎉 Show and Tell** - Share your projects using fej
5. **💬 General** - Everything else

### Step 3: Pin Important Discussions

**Pin these in order:**

1. v2.0 Announcement Discussion
2. v2 Alpha Sign-up
3. v2 Migration Help

### Step 4: Create Discussions

Create initial discussions using the templates above:

1. v2.0 Announcement (post immediately with v1.9 release)
2. v2 Alpha Sign-up (post immediately)
3. v2 Migration Help (post immediately)
4. v2.1+ Feature Requests (post after v2.0 scope is locked)

### Step 5: Moderate & Engage

**Response commitments:**

- Migration questions: 48 hours
- Critical migration blockers: 24 hours
- General questions: 48-72 hours
- Feature requests: Acknowledge within 1 week

**Weekly tasks:**

- Post progress update
- Respond to unanswered questions
- Close resolved discussions
- Pin important discussions

---

## Discussion Labels

**Suggested labels for issues/discussions:**

- `v2` - Related to v2.0
- `v2-migration` - Migration questions
- `v2-migration-blocker` - Critical migration issues
- `v2-feedback` - User feedback on v2
- `v2-alpha` - Alpha testing related
- `v2-beta` - Beta testing related
- `v2-bug` - Bugs specific to v2
- `v2-feature` - Feature requests for v2.1+

---

## Communication Principles

1. **Be responsive** - Acknowledge all comments within 48 hours
2. **Be transparent** - Share progress, challenges, and decisions openly
3. **Be appreciative** - Thank contributors and testers
4. **Be clear** - Use examples and comparisons
5. **Be patient** - Not everyone will be excited about breaking changes
6. **Be flexible** - Adapt based on feedback

---

**Status:** Ready to deploy with v1.9 release
**Created:** October 2025
