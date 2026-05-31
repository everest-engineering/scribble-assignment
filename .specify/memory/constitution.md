<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.1.0
Modified principles:
  - I. Brownfield-First: added explicit TypeScript requirement and no-rewrite rule
  - II. Deterministic Game Rules: added dual client+server input validation requirement
  - IV. Incremental Validation: added one-feature-group-at-a-time and granular commit rules
  - V. Simplicity & Scope Discipline: added dependency justification rule
Added sections: Technology Stack
Removed sections: none
Templates checked:
  - .specify/templates/plan-template.md       ✅ Constitution Check section aligns
  - .specify/templates/spec-template.md       ✅ Acceptance criteria format aligns
  - .specify/templates/tasks-template.md      ✅ Task structure aligns
Follow-up TODOs: none
-->

# Scribble Constitution

## Core Principles

### I. Brownfield-First

All feature work MUST begin with reading and understanding the relevant starter
files before writing any new code. The existing scaffold MUST NOT be rewritten
from scratch — extend and enhance only. New code MUST preserve the starter's
routing, API conventions, and in-memory store structure. Any deviation requires
explicit justification in the plan.

TypeScript MUST be used throughout. No plain `.js` files may be added to either
`frontend/` or `backend/`. All new files MUST use `.ts` or `.tsx` extensions
consistent with the starter.

### II. Deterministic Game Rules (NON-NEGOTIABLE)

Game behaviour MUST be deterministic and consistent with the spec:

- Secret word MUST be selected deterministically from the starter seed list
  (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`).
- All inputs (player names, guesses, room codes) MUST be trimmed and validated
  on both the client side and the server side. Client validation provides
  immediate feedback; server validation is the authoritative gate.
- Guesses MUST be compared case-insensitively after trimming; empty or
  whitespace-only guesses MUST be rejected with a clear error message.
- Empty or whitespace-only player names MUST be rejected with a clear error
  message on both client and server.
- A correct guess scores exactly 100 points; an incorrect guess scores 0.
- All game-rule logic (scoring, word comparison) MUST live in the backend;
  the frontend MUST NOT re-implement these calculations.

### III. Polling, Not Real-Time

All multi-player state synchronisation MUST use HTTP polling at approximately
2-second intervals. WebSockets, Server-Sent Events, and any other real-time
transport are explicitly out of scope and MUST NOT be introduced. Pre-existing
manual refresh MUST remain functional alongside the new polling behaviour.

### IV. Incremental Validation

Work MUST progress one feature group at a time following the scenario order in
the README (Scenario 1 → 2 → 3 → 4). Implementation MUST NOT advance to the
next feature group until the current scenario's acceptance criteria are manually
verified with two browser tabs. Spec artifacts (spec, plan, tasks) MUST be
updated for the current feature group before implementation begins — working
ahead of the current spec iteration is prohibited.

Every meaningful implementation slice MUST be committed separately. Commits MUST
be granular and traceable to a specific task ID in `tasks.md`. Bulk or
catch-all commits are prohibited.

### V. Simplicity & Scope Discipline

The implementation MUST stay within the scope defined in the README. No
out-of-scope feature may be added. New top-level npm dependencies MUST be
explicitly justified in the feature spec before being installed; unjustified
dependencies MUST be removed.

## Technology Stack

The following technology choices are fixed for this project and MUST NOT be
changed:

- **Frontend**: React + TypeScript (Vite, as provided by the starter)
- **Backend**: Node.js + Express + TypeScript (as provided by the starter)
- **State**: In-memory store only — no database, no file persistence
- **Sync**: HTTP polling only — no WebSockets, no SSE, no real-time transport
- **Language**: TypeScript throughout — no plain JS files added anywhere

## Out-of-Scope Constraints

The following are explicitly prohibited and MUST NOT appear in spec, plan,
tasks, or implementation:

- WebSockets or any real-time transport
- Databases or persistent storage (in-memory store only)
- Authentication, accounts, or sessions
- Deployment, CI/CD, Docker, or hosting work
- New state-management or routing libraries beyond the starter's dependencies
- Multiple rounds, drawer rotation, timers, countdowns, or bonus scoring
- Custom or random word packs beyond the starter seed list
- Spectator mode, moderation, room passwords, or invite links
- Rewriting the starter codebase from scratch
- Unjustified top-level npm dependencies
- Unrelated refactors

## AI Usage & Review Discipline

- Every AI-generated output (code, spec text, plan entry, task) MUST be
  reviewed and understood by the author before being committed. No blind accepts.
- AI suggestions that introduce out-of-scope features or violate any principle
  above MUST be rejected or corrected before use.
- Commits MUST represent the author's reasoned decisions, not unreviewed
  AI output.
- The reflection report MUST document where AI assistance was used, what was
  accepted, what was changed, and why.
- Spec Kit artifacts (constitution, spec, plan, tasks) MUST remain internally
  consistent; contradictions between artifacts MUST be resolved before proceeding.

## Governance

This constitution supersedes all other development practices for this project.
Any practice not addressed here defaults to the principle of simplicity (V).

**Amendment procedure**: Changes require updating this file with an incremented
version, a rationale comment in the Sync Impact Report, and a corresponding
commit. Minor wording fixes increment PATCH; new or expanded guidance increments
MINOR; principle removal or redefinition increments MAJOR.

**Compliance review**: Every PR MUST include a self-check that each
implementation change is traceable to a spec acceptance criterion and does not
violate any principle above.

**Version policy**: `MAJOR.MINOR.PATCH` per semantic versioning rules defined
in the Spec Kit constitution workflow.

**Version**: 1.1.0 | **Ratified**: 2026-05-31 | **Last Amended**: 2026-05-31
