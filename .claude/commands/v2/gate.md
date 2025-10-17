---
description: Evaluate stage gate criteria before proceeding to next phase
argument-hint: <gate-number> (0|1|2|3|4)
---

# V2 Project Stage Gate Evaluation

Stage gates ensure quality and prevent proceeding with unresolved issues.

## Gate Argument: $ARGUMENTS

---

## Gate 0: Before Starting (NOW)
**Command**: `/v2:gate 0`

**Questions to Answer:**
- [ ] Is 6-8 months available commitment?
- [ ] Is this the best use of time vs other opportunities?
- [ ] What defines "success" at the end?
- [ ] What's the exit strategy if it doesn't work?
- [ ] Have you answered all questions in V2_PLAN.md "Cost and Opportunity Analysis"?

**Decision**: Proceed only if 3+ motivations identified and opportunity cost evaluated.

---

## Gate 1: After Phase 0 (Week 4)
**Command**: `/v2:gate 1`

**Go Criteria:**
- [ ] Baseline metrics documented in BASELINE_METRICS.md
- [ ] v1.9 released with deprecation warnings
- [ ] At least 5 users aware of v2 timeline
- [ ] Co-maintainer committed OR backup plan defined
- [ ] Data-driven v2 targets set

**If NO**: Reconsider scope or timeline before Phase 1

---

## Gate 2: After Phase 1 (Week 11)
**Command**: `/v2:gate 2`

**Go Criteria:**
- [ ] All critical bugs fixed (P0/P1 = 0)
- [ ] CI/CD pipeline functional
- [ ] Tests passing
- [ ] TypeScript strict mode enabled
- [ ] Time tracking shows ≤120% of estimate

**If NO**: Adjust Phase 2 scope or timeline

---

## Gate 3: After Phase 2 (Week 19)
**Command**: `/v2:gate 3`

**Go Criteria:**
- [ ] All 8-10 features implemented
- [ ] All public APIs tested (3+ cases each)
- [ ] Bundle size <10KB verified
- [ ] Performance targets met (≤v1)
- [ ] No scope creep occurred

**If NO**: Feature freeze, move to Phase 3 with reduced scope

---

## Gate 4: Before Launch (Week 30+)
**Command**: `/v2:gate 4`

**Go Criteria:**
- [ ] Beta feedback positive
- [ ] Zero P0/P1 bugs
- [ ] Migration guide tested by 3+ users
- [ ] Codemod successfully migrates 3+ projects
- [ ] Community support channels ready
- [ ] TypeDoc generates docs without warnings

**If NO**: Extend RC phase, don't rush to launch

---

## Gate Evaluation Process

1. **Review Criteria**: Read all checklist items
2. **Assess Status**: Check each criterion objectively
3. **Identify Gaps**: Document any failing criteria
4. **Make Decision**: GO or NO-GO
5. **Take Action**:
   - If GO: Proceed to next phase
   - If NO-GO: Address gaps, adjust plan, or stop

**Usage**: `/v2:gate <0-4>` to evaluate specific gate
