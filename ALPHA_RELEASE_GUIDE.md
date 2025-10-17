# Alpha Release Guide

**Version**: 2.0.0-alpha.0
**Release Type**: Invite-Only Alpha
**npm Tag**: `alpha`
**Target Audience**: 10-20 selected testers

---

## Pre-Release Checklist

### Code Readiness
- [x] All Phase 2 features implemented and tested
- [x] 319 tests passing (100%)
- [x] Bundle size < 10KB (7.67 KB ✓)
- [x] TypeScript strict mode enabled
- [x] ESLint passing with zero errors
- [x] All critical bugs fixed (P0/P1)

### Documentation Readiness
- [x] MIGRATION_GUIDE_V2.md completed
- [x] ALPHA_TESTING_GUIDE.md created
- [x] ALPHA_TESTER_SELECTION.md created
- [x] ALPHA_WEEKLY_CHECKIN_TEMPLATE.md created
- [ ] README.md updated with alpha notice
- [x] Feature documentation complete (4 guides)

### Infrastructure Readiness
- [x] GitHub Actions CI/CD working
- [x] Multi-Node testing (18, 20, 22)
- [x] npm publishing configured
- [x] GitHub issue templates created
- [ ] GitHub Discussion categories set up
- [ ] Release notes prepared

---

## Release Steps

### 1. Final Pre-Release Testing

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Run all checks
npm run lint
npm run type-check
npm test
npm run build
npm run check:size

# Verify all passing ✓
```

### 2. Version Bump (Already Done)

```bash
# Current version in package.json
"version": "2.0.0-alpha.0"

# If needed to create new alpha:
# npm version prerelease --preid=alpha
```

### 3. Build for Release

```bash
# Clean build
npm run clean
npm run build

# Verify dist/ contents
ls -lah dist/
# Should contain:
# - index.js (CJS)
# - index.mjs (ESM)
# - index.d.ts (TypeScript declarations)
```

### 4. Publish to npm

```bash
# Publish with 'alpha' tag (DO NOT use 'latest')
npm publish --tag alpha --access public

# Verify published
npm view fej dist-tags
# Should show: { latest: '1.0.6', alpha: '2.0.0-alpha.0' }

# Test installation
npm install fej@alpha
```

### 5. Create GitHub Release

**Release Title**: `v2.0.0-alpha.0 - Invite-Only Alpha`

**Release Notes**: (See ALPHA_RELEASE_NOTES.md)

**Settings**:
- [x] Mark as pre-release
- [ ] Mark as latest release
- [x] Create from tag: `v2.0.0-alpha.0`
- [x] Target branch: `master` (or alpha branch)

### 6. Set Up GitHub Infrastructure

#### Discussion Categories
Create in Settings → Discussions:
1. **v2 Alpha Program** (for applications)
2. **v2 Alpha Feedback** (for general feedback)
3. **v2 Alpha Check-Ins** (for weekly updates)

#### Labels
Ensure these labels exist (Issues → Labels):
- `alpha-feedback` (general alpha feedback)
- `v2-migration` (migration issues)
- `v2-alpha` (alpha-specific)
- `P0`, `P1`, `P2`, `P3` (priority labels)

---

## Post-Release Steps

### 1. Announce Alpha Program

**Channels**:
1. GitHub Discussion (v2 Alpha Program)
2. README.md notice
3. Twitter/X (optional, invite-only)
4. Existing v1 users (GitHub Discussions)

**Message**: (See ALPHA_ANNOUNCEMENT.md)

### 2. Recruit Alpha Testers

1. Open applications via GitHub Discussion
2. Review applications using ALPHA_TESTER_SELECTION.md
3. Select 10-20 testers (diversity in experience/use cases)
4. Notify selected testers

### 3. Onboard Testers

**Send to each selected tester**:
- Welcome message
- Link to ALPHA_TESTING_GUIDE.md
- Link to first weekly check-in discussion
- Installation instructions
- Communication channels

**Template**:
```markdown
# Welcome to fej v2.0-alpha Testing! 🎉

Thank you for being selected as an alpha tester!

## Getting Started
1. Read the Alpha Testing Guide: [link]
2. Install: `npm install fej@alpha`
3. Join our first weekly check-in: [link to discussion]

## Resources
- Testing Guide: [link]
- Migration Guide: [link]
- Issue Templates: [link]
- Weekly Check-In Template: [link]

## Your First Steps
- Week 1 focus: Installation & Core Features
- Complete testing checklist items 1-5
- Report findings in weekly check-in

## Support
- Questions: GitHub Discussions
- Bugs: GitHub Issues with 'alpha-feedback' label
- Response time: 24-48h for P0/P1

Looking forward to your feedback!
```

### 4. Launch First Weekly Check-In

**Create Discussion**:
- Title: "Alpha Weekly Check-In - Week 1"
- Category: "v2 Alpha Check-Ins"
- Use template from ALPHA_WEEKLY_CHECKIN_TEMPLATE.md
- Pin discussion
- @mention all testers

---

## Monitoring & Support

### Daily Tasks (During Alpha)
- [ ] Check GitHub issues for P0/P1 bugs
- [ ] Respond to alpha discussions
- [ ] Monitor npm download stats
- [ ] Track tester progress

### Weekly Tasks
- [ ] Create new weekly check-in discussion
- [ ] Summarize previous week's feedback
- [ ] Triage and prioritize issues
- [ ] Release alpha patches if needed
- [ ] Update PROGRESS_DASHBOARD.md

### Response SLA
- **P0 (Critical)**: 24 hours
- **P1 (High)**: 48 hours
- **P2/P3**: 1 week
- **Questions/Feedback**: 48-72 hours

---

## Alpha Patch Releases

If critical bugs are found:

### 1. Fix and Test
```bash
# Fix bug
# Add regression test
npm test

# Verify fix
npm run lint
npm run type-check
npm run build
```

### 2. Version Bump
```bash
# Increment alpha version
# 2.0.0-alpha.0 → 2.0.0-alpha.1
npm version prerelease --preid=alpha
```

### 3. Publish Patch
```bash
npm run build
npm publish --tag alpha --access public
```

### 4. Notify Testers
```markdown
# 🔧 Alpha Patch Released: v2.0.0-alpha.1

## What's Fixed
- Bug #XXX: [Description]
- Bug #XXX: [Description]

## How to Update
npm install fej@alpha

## What to Test
Please re-test scenarios related to fixed bugs and report if issues persist.
```

---

## Success Metrics

### Week 1 Goals
- [ ] 10-20 testers selected and onboarded
- [ ] All testers install successfully
- [ ] At least 5 testers post in weekly check-in
- [ ] At least 3 issues reported

### Week 2 Goals
- [ ] At least 5 testers test advanced features
- [ ] At least 5 issues/feedback items
- [ ] Zero P0 bugs remaining
- [ ] Migration guide tested by 3+ testers

### Week 3 Goals
- [ ] At least 3 testers integrate into real projects
- [ ] At least 3 migration experience reports
- [ ] API design validated (no major change requests)
- [ ] Built-in utilities tested

### Week 4 Goals
- [ ] Final feedback from all testers
- [ ] Edge cases identified and documented
- [ ] Documentation improvements identified
- [ ] Beta readiness assessment complete

### Overall Alpha Success Criteria
- ✅ Zero P0/P1 bugs remaining
- ✅ At least 5 testers complete full checklist
- ✅ At least 3 testers integrate successfully
- ✅ At least 10 issues/feedback items reported
- ✅ Migration guide validated
- ✅ API design approved (no breaking changes requested)

---

## Transition to Beta

### Beta Readiness Checklist
- [ ] All alpha feedback addressed or documented
- [ ] Zero P0/P1 bugs
- [ ] Migration guide updated based on alpha feedback
- [ ] JSDoc coverage improved (from Phase 3.1)
- [ ] All alpha testers approve moving to beta
- [ ] Beta announcement prepared

### Beta Release Plan
```bash
# After alpha completion
npm version 2.0.0-beta.0
npm publish --tag beta --access public

# Public announcement
- GitHub Discussions
- Twitter/X
- Blog post
- Show HN (optional)
```

---

## Rollback Plan

If alpha reveals major issues:

### Scenario 1: Critical Bug Found
- Fix immediately and release alpha patch
- Do NOT rollback; fix forward

### Scenario 2: Major API Design Flaw
- Discuss with alpha testers
- If consensus for change: implement and release new alpha
- If breaking: document as known limitation, address in beta

### Scenario 3: Cannot Fix in Time
- Extend alpha period by 1-2 weeks
- Communicate delay to testers
- Update timeline and expectations

---

## Communication Templates

### Alpha Start Announcement
See: ALPHA_ANNOUNCEMENT.md

### Weekly Progress Update
```markdown
# Alpha Progress Update - Week [X]

## This Week
- [X] testers active
- [X] issues reported
- [X] features tested
- [X] feedback items

## Highlights
- [Notable feedback or achievement]

## Issues Resolved
- Issue #XXX: [Description]

## Next Week Focus
- [Focus area for next week]
```

### Alpha Completion Announcement
```markdown
# 🎉 Alpha Testing Complete - Thank You!

We've completed 4 weeks of alpha testing with [X] amazing testers!

## Alpha Results
- [X] testers participated
- [X] issues found and fixed
- [X] features validated
- [X] migration paths tested

## What's Next
- Beta release: [Date]
- Public testing begins
- RC target: [Date]
- Stable release: [Date]

## Thank You
Special thanks to our alpha testers:
[List testers who opted in to recognition]

## Beta Program
Beta will be public - no application needed.
Stay tuned for announcement!
```

---

## FAQ for Maintainers

### Q: What if we don't get enough alpha testers?
**A:** Minimum viable: 5 testers. If <10, extend recruitment by 1 week or proceed with smaller group.

### Q: What if a tester stops responding?
**A:** Ping once, if no response in 3 days, accept it and continue. Don't wait.

### Q: Should we accept more than 20 testers?
**A:** Yes, if applications are high quality. Cap at 30 to maintain manageable communication.

### Q: What if alpha takes longer than 4 weeks?
**A:** Extend by max 2 weeks. Communicate new timeline. If >6 weeks needed, re-evaluate scope.

### Q: When to release alpha patches?
**A:** For any P0/P1 bug fix. For P2/P3, batch into weekly patches if multiple fixes available.

---

**Last Updated**: 2025-10-17
**Release Status**: Ready for alpha publication
**Current Version**: 2.0.0-alpha.0 (published)
