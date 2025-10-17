# Alpha Tester Selection Guide

**Program**: fej v2.0-alpha Testing
**Target**: 10-20 participants
**Duration**: 4 weeks
**Status**: Recruiting

---

## Selection Criteria

### Required Qualifications

**Technical Skills:**
- ✅ Proficient in JavaScript/TypeScript
- ✅ Experience with Node.js (18+) and/or modern browsers
- ✅ Familiar with HTTP clients and fetch API
- ✅ Understands middleware patterns (bonus)

**Project Requirements:**
- ✅ Has an active project that uses fej v1 OR similar HTTP client
- ✅ Willing to test v2 in a non-production environment
- ✅ Can dedicate 3-5 hours/week for testing

**Communication:**
- ✅ Can provide weekly feedback via GitHub Discussions
- ✅ Responsive to questions (48h response time)
- ✅ Comfortable reporting bugs and suggestions
- ✅ English proficiency (for documentation feedback)

### Ideal Candidate Profile

**We're looking for diversity in:**

1. **Use Cases**
   - REST API clients
   - GraphQL clients (with fetch)
   - Browser-based applications
   - Node.js backend services
   - CLI tools
   - React/Vue/Angular applications

2. **Experience Levels**
   - Beginners (2 spots): New to fej, can provide fresh perspective
   - Intermediate (8-10 spots): Using fej in projects, understand patterns
   - Advanced (2-3 spots): Power users, custom middleware, complex setups

3. **Project Sizes**
   - Small projects (<10 files): Easy to migrate, quick feedback
   - Medium projects (10-50 files): Real-world usage
   - Large projects (50+ files): Enterprise/complex scenarios

4. **Environments**
   - Browser-only applications (2-3 spots)
   - Node.js backend (3-4 spots)
   - Full-stack applications (3-4 spots)
   - TypeScript projects (5-7 spots)
   - JavaScript projects (3-5 spots)

---

## How to Apply

### Application Process

**1. Submit Application**
- Open a GitHub Discussion in the "v2 Alpha Program" category
- Title: "Alpha Tester Application - [Your Name]"
- Use the template below

**2. Review Period**
- Applications reviewed within 3 business days
- Selected testers notified via GitHub + email

**3. Onboarding**
- Receive invite to private alpha channel
- Get access to ALPHA_TESTING_GUIDE.md
- Join first weekly check-in

---

## Application Template

```markdown
## Alpha Tester Application

### About Me
- **Name/Handle**: [Your name or GitHub handle]
- **GitHub**: [Your GitHub username]
- **Location/Timezone**: [For scheduling check-ins]
- **Experience Level**: Beginner / Intermediate / Advanced

### Technical Background
- **JavaScript/TypeScript Experience**: [X years]
- **fej Experience**: [Current user / Former user / New to fej]
- **Other HTTP Clients Used**: [e.g., axios, ky, wretch, etc.]
- **Middleware Patterns**: [Familiar / Some knowledge / New to this]

### Project Information
- **Project Type**: [REST API / GraphQL / Browser App / Node.js Backend / etc.]
- **Project Size**: [Small <10 files / Medium 10-50 / Large 50+]
- **Environment**: [Browser / Node.js / Both]
- **Language**: [JavaScript / TypeScript]
- **Current HTTP Client**: [fej v1 / other]

### Availability
- **Weekly Testing Time**: [X hours/week available]
- **Preferred Testing Days**: [e.g., Weekends, Weekdays after 6pm]
- **Alpha Duration**: [Can commit to full 4 weeks? Yes/No]

### Motivation
**Why do you want to participate in alpha testing?**
[Your answer here]

**What specific aspects of v2 are you most interested in testing?**
- [ ] Instance-based API
- [ ] Unified middleware
- [ ] Error handling & retry
- [ ] AbortController integration
- [ ] Built-in utilities
- [ ] Migration experience
- [ ] TypeScript support
- [ ] Documentation quality

**What can you bring to the alpha program?**
[Your unique perspective, use cases, or expertise]

### Use Case (Optional)
**Describe a specific use case you'll test:**
[e.g., "I'll test v2 in my React app that makes 50+ API calls with complex auth middleware"]

### Questions (Optional)
[Any questions about the alpha program?]

### Acknowledgment
- [ ] I understand this is alpha software and not production-ready
- [ ] I commit to providing weekly feedback for 4 weeks
- [ ] I will report bugs and suggestions constructively
- [ ] I can dedicate 3-5 hours/week for testing
```

---

## Selection Process

### Timeline
- **Applications Open**: TBD
- **Applications Close**: TBD (or when 20 spots filled)
- **Selection Notification**: Within 3 days of application
- **Alpha Start**: TBD

### Evaluation Criteria

**Scored on (1-5 scale):**

1. **Technical Fit** (30%)
   - Relevant experience with HTTP clients
   - Project matches testing needs
   - TypeScript experience (bonus)

2. **Commitment & Availability** (25%)
   - Can dedicate time weekly
   - Available for full 4 weeks
   - Responsive communication

3. **Use Case Diversity** (25%)
   - Fills gap in tester profile mix
   - Unique environment or scenario
   - Different from existing testers

4. **Communication & Feedback Quality** (20%)
   - Clear application
   - Articulate motivation
   - Constructive mindset

**Selection Strategy:**
- Top 5-7 scores: Auto-accept
- Next 5-7: Accept for diversity (fill gaps in use cases/experience)
- Remaining 3-6: Waitlist (accept if spots open)

---

## What Selected Testers Receive

### Benefits
1. **Early Access**
   - First to use v2 features
   - Influence final API design
   - Recognition as alpha tester

2. **Support**
   - Direct communication channel
   - Priority bug fixes
   - Dedicated Q&A sessions

3. **Recognition**
   - Listed in CHANGELOG.md as alpha tester (opt-in)
   - Badge in GitHub discussions (if program succeeds)
   - Acknowledgment in v2.0 release announcement

4. **Learning**
   - Deep understanding of v2 architecture
   - Migration experience before stable release
   - Networking with other testers and maintainers

---

## Responsibilities

### Weekly Commitments
- **Testing**: 3-5 hours/week
- **Check-Ins**: 15-30 minutes/week (Monday discussion)
- **Bug Reports**: As needed (timely reporting)
- **Feedback**: Constructive suggestions

### Expected Outputs
1. **Week 1**: Installation feedback, basic testing
2. **Week 2**: Advanced features testing, bug reports
3. **Week 3**: Real-world integration, migration experience
4. **Week 4**: Final feedback, documentation review, summary

### Communication Expectations
- Respond to maintainer questions within 48h
- Participate in weekly check-ins (or post async update)
- Report critical bugs (P0/P1) within 24h of discovery
- Provide final feedback summary in Week 4

---

## Frequently Asked Questions

### Q: Can I apply if I don't use fej currently?
**A:** Yes! We want testers with fresh perspectives too. Mention your experience with other HTTP clients.

### Q: What if I can't commit to all 4 weeks?
**A:** We prefer full commitment, but partial participation (2-3 weeks) may be accepted. Be upfront in your application.

### Q: Do I need to be an expert?
**A:** No! We want a mix of experience levels. Beginners provide valuable perspective on learning curve and documentation.

### Q: Can I test in production?
**A:** No. Alpha is for testing environments only. We cannot guarantee stability or support production issues.

### Q: What if I find a critical bug?
**A:** Report immediately as P0. We'll prioritize fixing and releasing a patch.

### Q: Can I invite my team?
**A:** Each person should apply individually. We'll consider team applications if you're testing together.

### Q: Will there be beta testing?
**A:** Yes! After alpha, we'll have public beta (no application needed). Alpha testers get first access.

### Q: What if I'm selected but can't participate?
**A:** Let us know ASAP so we can offer your spot to someone on the waitlist.

---

## For Maintainers: Selection Checklist

### Before Selection
- [ ] Applications reviewed within 3 days
- [ ] Score each application on 4 criteria
- [ ] Check for diversity in use cases and experience
- [ ] Verify GitHub profiles are active

### Selection
- [ ] Select top scorers first
- [ ] Fill gaps for diversity
- [ ] Ensure mix of:
  - [ ] Experience levels (beginner/intermediate/advanced)
  - [ ] Environments (browser/Node.js/both)
  - [ ] Languages (JavaScript/TypeScript)
  - [ ] Project sizes (small/medium/large)

### After Selection
- [ ] Notify selected testers via GitHub Discussion + email
- [ ] Send onboarding materials (ALPHA_TESTING_GUIDE.md)
- [ ] Create private discussion channel
- [ ] Schedule first weekly check-in
- [ ] Notify waitlist candidates of their status

### Waitlist Management
- [ ] Track waitlist candidates
- [ ] Notify if spots open
- [ ] Consider expanding to 25 if high quality applications

---

## Contact

**Questions about alpha program:**
- GitHub Discussions: "v2 Alpha Program" category
- Maintainer: @maxali

**Application issues:**
- Email: [maintainer email]
- GitHub: Open issue with label `alpha-program`

---

**Last Updated**: 2025-10-17
**Program Status**: Planning Phase
**Applications**: Not yet open
