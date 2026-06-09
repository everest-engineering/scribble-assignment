# Scribble Constitution

## Core Principles

### I. Spec-Driven Development

All work MUST follow the Spec Kit workflow:

Discovery → Specify → Clarify → Plan → Tasks → Implement → Validate

Implementation without an approved specification is prohibited. Every feature, behavior, and code change must be traceable to a documented requirement and acceptance criterion.

---

### II. TypeScript Quality & Validation

All source code MUST be written in TypeScript.

Requirements:

- The `any` type is forbidden.
- External inputs must be validated.
- Types must accurately represent application state.
- Existing project patterns and conventions must be followed.
- Code should prioritize readability and maintainability over cleverness.

---

### III. Incremental Delivery

Development MUST proceed by feature group.

Each feature group must:

- Have defined acceptance criteria.
- Be planned before implementation.
- Be validated before moving to the next feature group.

Large, unreviewable changes are discouraged. Work should be delivered in small, testable increments.

---

### IV. Traceability & Documentation

Every implementation task MUST be traceable to:

- A specification requirement.
- An acceptance criterion.
- A planned implementation task.

Discovery notes must include:

- At least 3 identified gaps or incomplete behaviors.
- At least 2 documented assumptions.
- A list of relevant files reviewed.

When implementation differs from the original plan, the deviation must be documented.

---

### V. Review Discipline

Every pull request and review MUST verify:

- Specification alignment.
- Acceptance criteria coverage.
- Edge-case handling.
- Multi-room isolation behavior.
- No out-of-scope work introduced.
- Consistency between specification, plan, tasks, and implementation.

Code that does not satisfy documented requirements must not be approved.

---

## AI Usage Rules

AI assistance may be used for:

- Discovery and analysis
- Specification drafting
- Planning and task generation
- Implementation assistance
- Test generation
- Documentation

Developers remain responsible for:

- Validating AI-generated outputs
- Verifying correctness
- Maintaining artifact consistency
- Updating specifications, plans, and tasks
- Ensuring implementation matches requirements

AI-generated code MUST be reviewed before being committed.

---

## Additional Constraints

The following items are explicitly out of scope and MUST NOT be built, specified, planned, or implemented:

### Technical

- WebSockets or real-time synchronization
- Databases or persistent storage
- Authentication, accounts, or sessions
- Deployment, hosting, or CI/CD pipelines
- Docker or containerization
- New state-management libraries
- New routing libraries
- Unjustified top-level dependencies

### Game Features

- Multiple rounds
- Drawer rotation
- Round timers or countdowns
- Speed bonuses
- Drawer bonuses
- Custom word packs
- Random word packs
- Spectator mode
- Room moderation (kick, mute)
- Room passwords
- Invite links

### Process

- Rewriting the starter project from scratch
- Refactoring unrelated code
- Scope expansion beyond documented requirements

---

## Development Workflow

Each feature group MUST follow this process:

1. Discovery
   - Review relevant files.
   - Identify gaps and assumptions.
   - Document findings.

2. Specify
   - Define requirements.
   - Define acceptance criteria.

3. Clarify
   - Resolve ambiguities before planning.

4. Plan
   - Document state changes.
   - Document data flow.
   - Document file-level changes.

5. Tasks
   - Break work into ordered, testable tasks.
   - Identify dependencies.

6. Implement
   - Complete one meaningful slice at a time.

7. Validate
   - Verify acceptance criteria.
   - Verify behavior using two browser tabs.

8. Review
   - Confirm consistency across all artifacts.

Progression to the next feature group is not permitted until the current feature group has been validated.

---

## Governance

This constitution supersedes all project conventions and practices.

Amendments require:

- Documented rationale
- Stakeholder approval
- Impact assessment
- Migration plan (when applicable)

All project artifacts must remain consistent with this constitution.

Complexity must be justified relative to simpler alternatives.

Runtime development guidance may be maintained separately in AGENTS.md.

**Version:** 1.0.0
**Ratified:** 2026-06-09
**Last Amended:** 2026-06-09
