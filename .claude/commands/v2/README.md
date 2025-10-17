# V2 Project Slash Commands

Custom slash commands for executing the fej v2.0 development plan step-by-step.

## Quick Start

```
/v2:start       # Initialize V2 project infrastructure
/v2:status      # Check current progress and status
/v2:phase0      # Execute Phase 0 - Preparation
```

## All Commands

### Project Management

| Command | Description | Usage |
|---------|-------------|-------|
| `/v2:start` | Initialize V2 project | `/v2:start` |
| `/v2:status` | Check overall status | `/v2:status` |
| `/v2:gate <0-4>` | Evaluate stage gate | `/v2:gate 1` |
| `/v2:review` | Weekly review template | `/v2:review` |

### Phase Execution

| Command | Description | Usage |
|---------|-------------|-------|
| `/v2:phase0` | Phase 0: Preparation | `/v2:phase0` or `/v2:phase0 0.1` |
| `/v2:phase1` | Phase 1: Foundation | `/v2:phase1` or `/v2:phase1 1.1` |
| `/v2:phase2` | Phase 2: Core Features | `/v2:phase2` or `/v2:phase2 2.1` |
| `/v2:phase3` | Phase 3: Documentation | `/v2:phase3` or `/v2:phase3 3.1` |
| `/v2:phase4` | Phase 4: Launch | `/v2:phase4 alpha` |

### Specific Tasks

| Command | Description | Usage |
|---------|-------------|-------|
| `/v2:fix-bug` | Fix critical bugs | `/v2:fix-bug async-middleware` |

## Command Arguments

Most commands accept optional arguments to focus on specific tasks:

### Phase Commands
- `/v2:phase0 0.1` - Work on baseline measurement
- `/v2:phase1 1.2` - Work on tooling modernization
- `/v2:phase2 2.3` - Work on AbortController integration
- `/v2:phase3 3.1` - Work on API documentation
- `/v2:phase4 beta` - Work on beta release

### Bug Fix Command
- `/v2:fix-bug async-middleware` - Fix async middleware bug
- `/v2:fix-bug addmiddleware` - Fix addMiddleware async declaration
- `/v2:fix-bug deepmerge` - Fix deep merge edge cases
- `/v2:fix-bug error-boundaries` - Add error boundaries

### Gate Command
- `/v2:gate 0` - Pre-start evaluation
- `/v2:gate 1` - After Phase 0 evaluation
- `/v2:gate 2` - After Phase 1 evaluation
- `/v2:gate 3` - After Phase 2 evaluation
- `/v2:gate 4` - Pre-launch evaluation

## Workflow Example

### Starting V2 Development

```bash
# 1. Initialize project
/v2:start

# 2. Check if ready to start
/v2:gate 0

# 3. Begin Phase 0
/v2:phase0 0.1

# 4. Check progress
/v2:status

# 5. Evaluate Phase 0 completion
/v2:gate 1

# 6. Move to Phase 1
/v2:phase1 1.1
```

### Weekly Maintenance

```bash
# Monday: Review last week
/v2:review

# Throughout week: Work on current phase
/v2:phase1 1.2

# Friday: Check status
/v2:status
```

## Success Criteria Tracking

Each phase command shows its success criteria. Use `/v2:gate <n>` to formally evaluate if criteria are met before proceeding.

## Tips

1. **Start with `/v2:start`** to set up infrastructure
2. **Use `/v2:status`** frequently to track progress
3. **Complete gate evaluations** before moving between phases
4. **Run `/v2:review`** weekly for consistency
5. **Pass arguments** to focus on specific tasks
6. **Check success criteria** in each phase command

## Project Structure

Commands are organized under `.claude/commands/v2/`:

```
.claude/commands/v2/
├── start.md          # Project initialization
├── status.md         # Overall status check
├── gate.md           # Stage gate evaluation
├── review.md         # Weekly review template
├── phase0.md         # Phase 0 execution
├── phase1.md         # Phase 1 execution
├── phase2.md         # Phase 2 execution
├── phase3.md         # Phase 3 execution
├── phase4.md         # Phase 4 execution
├── fix-bug.md        # Bug fixing helper
└── README.md         # This file
```

## References

- **V2_PLAN.md** - Complete development plan
- **V2_IMPLEMENTATION_GUIDE.md** - Technical specifications
- **V2_PLAN_CRITICAL_REVIEW.md** - Critical analysis
- **QUICK_START_V2.md** - Quick start guide

## Getting Help

If a command isn't working as expected:
1. Check the command syntax in this README
2. Review the relevant phase documentation
3. Ask Claude: "Explain the /v2:phase1 command"
4. Check if prerequisites are met (e.g., Phase 0 complete before Phase 1)

---

**Ready to start?** Run `/v2:start` to begin!
