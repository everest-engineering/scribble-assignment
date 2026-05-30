<!--
SYNC IMPACT REPORT
==================
Version change: [TEMPLATE] → 1.0.0
Modified principles: N/A (initial fill — no prior concrete version)
Added sections:
  - Core Principles (5 principles filled)
  - Coding Standards & AI Usage
  - Testing & Self-Review
  - Governance
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ (Constitution Check section aligns with principles below)
  - .specify/templates/spec-template.md ✅ (scope constraints align with out-of-scope list)
  - .specify/templates/tasks-template.md ✅ (task phases align with incremental validation principle)
Follow-up TODOs: None — all placeholders resolved.
-->

# Scribble Assignment Constitution

## Core Principles

### I. Brownfield-First

This project MUST be enhanced incrementally on top of the existing scaffold. AI and developers MUST
read and understand the relevant starter files before proposing any change. Rewriting the starter
from scratch is prohibited. New code MUST integrate with existing routing, components, and API
patterns rather than replacing them. Every change MUST be explainable by reference to a spec
artifact.

### II. Spec-Driven Development

No feature code MAY be written without a corresponding spec artifact (spec.md, plan.md, tasks.md).
Acceptance criteria MUST be defined before implementation begins. Deviations between code behavior
and the spec MUST be documented explicitly. AI-generated output MUST be reviewed and verified
against the spec before committing. Complete a minimum of 4 specify iterations across the lab.

### III. Deterministic Game Rules

Game mechanics MUST produce consistent, testable outcomes:
- Word selection MUST be deterministic (from the starter seed list; no random or external packs).
- Drawer assignment MUST follow a defined rule (host or first player for the first round).
- Scoring MUST be fixed: correct guess = 100 points, incorrect guess = 0 points.
- Guess comparison MUST be case-insensitive and trim whitespace.
- Empty or whitespace-only player names and guesses MUST be rejected with a clear message.

Non-determinism (timers, countdowns, rotation across multiple rounds) is out of scope and MUST NOT
be introduced.

### IV. Incremental Validation

Each user story slice MUST be independently testable before the next slice begins. Validation MUST
use two real browser tabs to confirm multi-player behavior. Polling intervals MUST be approximately
2 seconds (lobby and guess-history sync). No story is complete until its acceptance scenarios from
the spec pass in the browser. Commits MUST be granular and map to individual tasks or logical
groups.

### V. Simplicity and Scope Discipline

YAGNI applies strictly. The following are permanently out of scope and MUST NOT appear in spec,
plan, tasks, or code:
- WebSockets, real-time sync, databases, auth, sessions, deployment, Docker
- Multiple rounds, timers, countdowns, speed/drawer bonuses, drawer rotation
- Custom/random word packs, spectator mode, moderation, room passwords
- New state-management or routing libraries beyond the starter
- Unrelated refactors or unjustified top-level dependencies

Complexity MUST be justified in the plan's Complexity Tracking table before implementation. When
in doubt, choose the simpler option.

## Coding Standards & AI Usage

- **Language/Stack**: TypeScript throughout. Frontend: Vite + React + TypeScript. Backend: Node.js +
  Express + TypeScript. In-memory store only — no database.
- **Type safety**: TypeScript strict mode; `any` is prohibited unless explicitly justified.
- **File placement**: New backend code in `backend/src/`; new frontend code in `frontend/src/`.
  Follow the existing directory conventions (`models/`, `services/`, `api/`, `components/`, `pages/`).
- **AI usage rules**: AI-generated code MUST be read, understood, and verified by the developer
  before committing. AI MUST NOT be allowed to commit directly without human review. Prompts MUST
  reference specific spec acceptance criteria.
- **Commits**: Every commit MUST be traceable to a task ID and MUST reference the relevant spec
  scenario. Vague commit messages (e.g., "fix stuff") are not acceptable.
- **Out-of-scope detection**: If an AI assistant suggests out-of-scope work (WebSockets, auth,
  databases), reject and redirect it to the in-scope spec.

## Testing & Self-Review

- **Browser validation**: Every implemented story MUST be verified with two browser tabs before
  marking it complete. The Quick Verification steps in README.md serve as the baseline smoke test.
- **Edge cases**: Validation MUST cover empty input, whitespace-only input, invalid room codes,
  multi-room isolation, and case-insensitive guess matching.
- **Build gates**: Both `backend/npm run build` and `frontend/npm run build` MUST pass before
  raising a pull request.
- **Self-review**: The developer MUST review the PR diff against the spec and plan before requesting
  review. Implementation alignment (code matches spec) is a graded rubric item.
- **Test scope**: Automated tests are optional for this lab. When included, they MUST target the
  API contract and integration paths, not mocked internals.

## Governance

This constitution supersedes all other informal practices for this project. Amendments require:
1. A documented rationale for the change.
2. An update to this file with a version bump (MAJOR for principle removal/redefinition, MINOR for
   new principle/section, PATCH for clarifications).
3. A corresponding update to any affected templates under `.specify/templates/`.

All pull requests MUST be checked against this constitution before merging. Complexity MUST be
justified; scope creep MUST be flagged. Use `README.md` and `.specify/memory/` for runtime
development guidance.

**Version**: 1.0.0 | **Ratified**: 2026-05-30 | **Last Amended**: 2026-05-30
