<!--
SYNC IMPACT REPORT
==================
Version change:        (unversioned placeholder) → 1.0.0
Bump rationale:        MAJOR — initial ratification; all placeholders replaced for the first time.

Modified principles:   N/A (initial fill — no prior named principles to rename)
Added sections:        Core Principles (×5), Tech Stack Constraints, AI-Assisted Development & Review Discipline, Governance
Removed sections:      N/A

Templates reviewed:
  ✅ .specify/templates/plan-template.md   — Constitution Check gate section is intentionally dynamic;
                                             no template edit needed.
  ✅ .specify/templates/spec-template.md   — Generic structure; compatible with all five principles.
  ✅ .specify/templates/tasks-template.md  — Generic structure; task phases align with principles.

Follow-up TODOs:
  - None. All fields resolved from repository context.
-->

# Scribble Assignment Constitution

## Core Principles

### I. TypeScript-First

All source code MUST be written in TypeScript with explicit types. `any` is forbidden;
use `unknown` where a type is genuinely dynamic and narrow with type guards before use.
Every function parameter, return type, and exported symbol MUST carry a declared type.
Implicit `any` from missing annotations MUST be treated as a compile error.

### II. In-Memory State Only

No databases — SQL, NoSQL, SQLite, or any persistent storage — are permitted at any
layer. All room and game state lives exclusively in the backend `Map<string, Room>`.
Data lost on server restart is acceptable by design. Inactive rooms MUST be explicitly
removed to bound memory growth; unbounded accumulation is a defect.

### III. HTTP Polling — No Real-Time Protocols

WebSockets, Socket.io, Server-Sent Events, and any push-based protocol are forbidden.
Clients MUST synchronise state by polling HTTP endpoints. The lobby MUST poll at
approximately 2-second intervals. Polling MUST be bounded (started and stopped
deliberately); open-ended `setInterval` calls with no cleanup are a defect.

### IV. Validate at Every System Boundary

All request payloads, route parameters, and query strings entering the backend MUST be
validated with Zod before any business logic runs. Invalid input MUST produce a 400
response with a structured JSON body. The frontend MUST handle API errors gracefully;
the UI MUST NOT crash or display a blank screen on network or validation failures.
Form submissions MUST NOT be no-ops — submitting a form MUST trigger an API call or
display a clear validation message to the user.

### V. Minimal Footprint — No Auth, YAGNI

Authentication, sessions, JWT, OAuth, and role-based access control are forbidden.
The host is tracked solely by a `hostId` field on the room; no external identity
provider is involved. No speculative abstractions, helper utilities, or extra layers
MUST be introduced unless they are required by a current user story. Prefer pure
functions and immutable data structures. Keep components and services focused on a
single responsibility.

## Tech Stack Constraints

- **Backend**: Node.js 18+, Express, TypeScript, Zod, `tsx` for execution.
- **Frontend**: React 18, React Router v6, Vite, TypeScript.
- **State management**: follow the `RoomStore` pattern in `frontend/src/state/roomStore.ts`
  (custom observable class + `useSyncExternalStore`). Do not introduce a second state
  library.
- **Testing**: Vitest for both backend and frontend unit tests.
- **No new runtime dependencies** may be added without explicit justification against
  Principle V. Each new dependency MUST be evaluated for maintenance burden and bundle
  size.
- **Known starter defect** _(resolved in feature 001)_: `VITE_API_URL` in `frontend/src/services/api.ts`
  originally defaulted to `http://localhost:3001/bug`. The correct value is `http://localhost:3001`
  (no `/api` suffix — the Express router is mounted at the root path). This has been corrected;
  no further action required.

## AI-Assisted Development & Review Discipline

- **Discovery before coding**: read all relevant starter files and produce or update
  `DISCOVERY.md` before writing new code for any scenario.
- **Spec Kit artifacts are mandatory**: constitution, spec, plan, and task files MUST be
  kept current and committed before each implementation phase begins.
- **AI output MUST be reviewed**: every AI-generated code change MUST be read, understood,
  and verified against the acceptance criteria before committing. Blind acceptance of
  AI output is a violation of this constitution.
- **Incremental commits**: each meaningful slice of functionality MUST be committed
  independently with a descriptive message. Large, undifferentiated commits are
  prohibited.
- **Validation gate**: each user story MUST be verified with at least two browser tabs
  (multi-player flow) before the story is marked complete.

## Governance

This constitution supersedes all other practices and conventions in this repository.
Any conflict between this document and other guidance is resolved in favour of this
constitution.

**Amendment procedure**:

1. Update this document with concrete changes and increment the version according to
   semantic versioning (MAJOR: principle removed or redefined; MINOR: principle or
   section added; PATCH: clarification or wording fix).
2. Propagate changes to all affected Spec Kit templates under `.specify/templates/`.
3. Commit with a message of the form `docs: amend constitution to vX.Y.Z — <reason>`.
4. All pull-request reviews MUST verify compliance with the active constitution version
   before approval.

Complexity in any implementation MUST be justified against Principle V before merging.

**Version**: 1.0.0 | **Ratified**: 2026-06-03 | **Last Amended**: 2026-06-03
