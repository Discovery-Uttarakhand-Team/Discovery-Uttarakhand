# Discovery Uttarakhand - Claude Code Project Rules & Skill Trigger Matrix

## Mandatory Skill Application Protocol
Whenever tackling ANY task, bug, feature, refactor, or query in this project, Claude Code MUST proactively diagnose the problem domain and immediately read/apply the matching skill (`SKILL.md`) before writing or modifying code.

### Problem-to-Skill Mapping Matrix

| Problem / Task Category | Triggers & Symptoms | Required Skill & Path | Key Actions |
| :--- | :--- | :--- | :--- |
| **Backend & APIs** | Express routes, Node.js controllers, database models/queries, pagination, caching, response serialization, repository pattern | `.agents/skills/backend-patterns/SKILL.md` | Follow RESTful structure, repository pattern, DTO validation, transaction management |
| **Frontend & UI** | React components, UI state, rendering bugs, responsive layouts, CSS/styling, interactive animations | `.agents/skills/frontend-patterns/SKILL.md` | Component modularity, custom hooks, proper memoization, responsive design, state isolation |
| **Bug Fixes & Feature Work** | New features, bug fixes, edge case handling, regressions, test coverage | `.agents/skills/tdd-workflow/SKILL.md` | Red-Green-Refactor, write failing test first, keep test coverage >= 80% |
| **Auth & Security** | Authentication, JWT, user inputs, payment processing, secrets/env, CORS, injection vulnerabilities, rate limiting | `.agents/skills/security-review/SKILL.md` | Validate input schemas, sanitize inputs, enforce strict authorization, never expose secrets |
| **Code Style & Refactoring** | Code cleanup, typing, file organization, immutability, naming conventions | `.agents/skills/coding-standards/SKILL.md` | Immutability, strict TypeScript/JS standards, clean modular exports, single responsibility |
| **Diagnostics & Verification** | Failing builds, verification after changes, continuous test evaluation | `.agents/skills/verification-loop/SKILL.md` & `.agents/skills/eval-harness/SKILL.md` | Verify systematically, run QA verification scripts, assert edge conditions before closing task |
| **High-Performance Analytics** | Analytics queries, high-throughput aggregation, large datasets | `.agents/skills/clickhouse-io/SKILL.md` | Optimize analytical aggregations, column projection, partition awareness |
| **Context & Memory Management** | Multi-phase complex work, context compacting, persisting session patterns | `.agents/skills/strategic-compact/SKILL.md` & `.agents/skills/continuous-learning/SKILL.md` | Compact context logically, record reusable patterns |

## Execution Workflow at Every Step:
1. **Diagnose Problem Domain**: Before writing code, identify which category above the current task belongs to.
2. **Consult Matching Skill**: Inspect the corresponding `.agents/skills/<skill-name>/SKILL.md` (or installed plugin skill).
3. **Follow Prescribed Patterns**: Apply the architectural rules, security guardrails, and implementation patterns from the skill.
4. **Verify & Validate**: Run tests/scripts (`npm test`, verification scripts in `backend/scripts`, etc.) to prove correctness.
