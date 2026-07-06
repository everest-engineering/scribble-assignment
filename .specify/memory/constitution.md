<!--
  Sync Impact Report
  ==================
  Version change: 0.0.0 (template) → 1.0.0
  Bump rationale: Initial constitution fill-in from template; all placeholders
  resolved with project-specific values derived from README and AGENTS.md.

  Modified principles (all new):
    - [PRINCIPLE_1_NAME] → I. Deterministic Game Logic
    - [PRINCIPLE_2_NAME] → II. RESTful Synchronization
    - [PRINCIPLE_3_NAME] → III. Validation Rigor
    - [PRINCIPLE_4_NAME] → IV. Brownfield Enhancement
    - [PRINCIPLE_5_NAME] → V. State Isolation & Immutability

  Added sections:
    - Technical Constraints (was [SECTION_2_NAME])
    - Development Workflow (was [SECTION_3_NAME])
    - Governance rules filled with amendment procedure and compliance policy

  Removed sections: None

  Templates requiring updates:
    - ✅ .specify/templates/constitution-template.md (source template, unchanged)
    - ✅ .specify/templates/plan-template.md (Constitution Check section is generic — no principle-specific references)
    - ✅ .specify/templates/spec-template.md (generic template, no direct constitution references)
    - ✅ .specify/templates/tasks-template.md (generic template, no direct constitution references)
    - ✅ .specify/templates/checklist-template.md (generic template, no direct constitution references)

  Follow-up TODOs: None — all placeholders resolved.
-->

# Scribble Guessing Game Constitution

## Core Principles

### I. Deterministic Game Logic

All game rules MUST operate deterministically based solely on the current
in-memory room state. Word selection MUST use a deterministic index from the
starter word list. Player scores MUST be exactly 100 for a correct guess and 0
for an incorrect guess — no bonuses, penalties, or partial credit. Drawer
assignment MUST follow a fixed rule (first player / host is the drawer). No
random, time-based, or probabilistic outcomes are permitted during gameplay.
This ensures reproducible game states during testing and debugging.

### II. RESTful Synchronization

All client-server communication MUST use HTTP request-response only. The
frontend MUST poll for state updates at a fixed cadence (~2s for lobby). The
server MUST NOT push data to clients — no WebSockets, Socket.io, Server-Sent
Events, or any real-time push protocol. The frontend is responsible for
initiating every state read through polling. This keeps the backend stateless
in its communication model and simplifies testing with standard HTTP tooling.

### III. Validation Rigor

Every user input MUST be trimmed of leading/trailing whitespace before
processing. Empty or whitespace-only values for player names, room codes, and
guesses MUST be rejected with a clear, user-visible error message. Guess
comparison MUST be case-insensitive. Room codes MUST be validated for
existence and format before any state mutation. The backend MUST use Zod
schemas to validate all request payloads. The frontend MUST show validation
errors inline and never silently drop invalid input.

### IV. Brownfield Enhancement

Before writing any new code, read and understand the existing starter code in
`backend/` and `frontend/`. Match the established patterns for file structure,
naming conventions, typing style, and import style. Do not rewrite files that
already work — extend them. No new top-level dependencies may be added without
explicit justification in the plan. Do not restructure directories, rename
existing exports, or reformat existing files unless required by the feature
specification. This principle preserves the evaluable diff between starter and
deliverable.

### V. State Isolation & Immutability

Each game room is an isolated state island. Room state MUST be treated as
immutable — updates produce new state snapshots, never in-place mutations. No
cross-room state leakage is permitted. Inactive rooms (sessions where all
players have left or the game has ended and not restarted) MUST be eligible for
cleanup to keep memory bounded. On the frontend, prefer immutable update
patterns (spread syntax, `map`/`filter`, or Immer-style helpers if already
present) when deriving new UI state from fetched snapshots.

## Technical Constraints

- **Language**: TypeScript throughout. No `any` — use `unknown` for truly
  dynamic types. ES Modules exclusively (`import`/`export`).
- **Backend**: Node.js 18+ with Express. Zod for request validation. `tsx` for
  development execution. Room data stored in-memory only.
- **Frontend**: React 18 with functional components and hooks. React Router v6
  for routing. Vite for build and dev server. State via established store
  pattern in `src/state/`.
- **Forbidden**: No WebSockets or real-time push protocols. No databases (SQL,
  NoSQL, SQLite, etc.). No authentication, sessions, JWT, or OAuth. No
  additional state-management libraries beyond what the starter ships.
- **Sync model**: HTTP polling only — the frontend polls for room state
  updates; the server never initiates communication.

## Development Workflow

1. **Inspect first** — read relevant starter files before writing code.
2. **Follow the loop** — discovery → specify → clarify → plan → tasks →
   implement → validate. Complete each step before advancing.
3. **Granular commits** — commit one meaningful slice at a time so the diff
   between starter and deliverable remains reviewable.
4. **Two-browser validation** — test all multiplayer flows with at least two
   browser tabs/ windows. Single-player testing is insufficient.
5. **Build before handoff** — run `npm run build` in both `backend/` and
   `frontend/` before considering any feature complete.
6. **Review AI output** — critically review all AI-generated code before
   committing. The author is responsible for every line.
7. **Scenario order** — implement and validate scenarios in order (Room Setup →
   Game Start → Gameplay → Result/Restart). Do not skip ahead.

## Governance

This constitution defines the binding rules for the Scribble project. It
supersedes any informal guidelines, personal preferences, or tool defaults.

- **Amendments**: Any change to this constitution requires a version bump
  (following SEMVER rules documented below), documented rationale, and a brief
  migration note if existing practices must change.
- **Versioning**: Use MAJOR.MINOR.PATCH format:
  - MAJOR: Backward-incompatible governance or principle changes (removal,
    redefinition).
  - MINOR: New principle, section, or materially expanded guidance.
  - PATCH: Clarifications, wording improvements, typo fixes, non-semantic
    refinements.
- **Compliance**: All pull requests and specification iterations must verify
  compliance with these principles. Any violation must be flagged and justified
  in the Complexity Tracking section of the plan.
- **Guidance**: Use `AGENTS.md` for runtime development guidance (tool use,
  agent conventions). The constitution defines the *what* and *why*; AGENTS.md
  defines the *how* for AI agents.

**Version**: 1.0.0 | **Ratified**: 2026-07-05 | **Last Amended**: 2026-07-05
