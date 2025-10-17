---
description: Execute Phase 4 - Staged Release & Launch
argument-hint: <stage> (alpha|beta|rc|stable)
allowed-tools: Bash(npm:*), Bash(git:*)
---

# Phase 4: Staged Release & Launch (10-14 weeks)

## Staged Rollout Timeline

```
Phase 0-3 Complete
    ↓
Alpha (Invite-only, 1 month)
    ↓
Beta (Public, 1 month)
    ↓
RC (Feature freeze, 2 weeks)
    ↓
Stable (Launch, 2 weeks)
```

## Current Release Stage
Argument provided: **$ARGUMENTS**

---

## 4.1 Alpha Release (2 weeks prep + 1 month testing)
**Command**: `/v2:phase4 alpha`

**Preparation:**
- [ ] Complete all Phase 1-3 work
- [ ] Internal testing and validation
- [ ] Select 10-20 beta testers
- [ ] Prepare alpha documentation
- [ ] Set up private feedback channel

**Alpha Period:**
- [ ] Release v2.0.0-alpha to npm with `alpha` tag
- [ ] Announce in private channels only
- [ ] Weekly check-ins with testers
- [ ] Gather feedback on API, performance, migration
- [ ] Fix critical P0/P1 bugs
- [ ] Update migration guide

## 4.2 Beta Release (1 week prep + 1 month testing)
**Command**: `/v2:phase4 beta`

**Preparation:**
- [ ] Address all alpha feedback
- [ ] Update docs with learnings
- [ ] Finalize migration guide

**Beta Period:**
- [ ] Release v2.0.0-beta to npm (still not `latest`)
- [ ] Public announcement (blog, GitHub, social media)
- [ ] Actively solicit feedback
- [ ] Performance optimization
- [ ] Bundle size verification
- [ ] Security audit
- [ ] Browser compatibility testing

## 4.3 Release Candidate (1 week prep + 2 weeks testing)
**Command**: `/v2:phase4 rc`

**Preparation:**
- [ ] Address all beta feedback
- [ ] FEATURE FREEZE - no new features
- [ ] Final documentation review

**RC Period:**
- [ ] Release v2.0.0-rc to npm
- [ ] Bug fixes ONLY
- [ ] Final testing (Node 18/20/22, all browsers)
- [ ] Finalize migration guide
- [ ] Complete codemod tool
- [ ] Test codemod on real projects

## 4.4 Stable Release (2 weeks)
**Command**: `/v2:phase4 stable`

**Preparation:**
- [ ] Final RC validation
- [ ] Prepare launch materials

**Launch:**
- [ ] Release v2.0.0 stable to npm
- [ ] Tag as `latest` 🚀
- [ ] Update all documentation
- [ ] Launch announcement campaign
- [ ] Showcase early adopters
- [ ] Community celebration

---

## Success Criteria (Gate 4)
- [ ] Zero known P0/P1 bugs
- [ ] At least 10 production apps using beta
- [ ] Performance targets met
- [ ] Bundle size <10KB verified
- [ ] Migration guide tested by 5+ users
- [ ] Codemod successfully migrates 3+ projects

**Usage**: `/v2:phase4 alpha|beta|rc|stable` to work on specific stage
