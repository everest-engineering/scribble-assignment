# Scribble Lab Constitution

This constitution is the persistent guardrail for every Spec Kit iteration in this repo. It binds humans and AI assistants equally. Later `spec.md`, `plan.md`, and `tasks.md` files must conform to it; any intentional deviation requires an explicit **Constitutional exception** subsection in the relevant `spec.md` with a one-paragraph rationale and a sunset condition.

Lab scope, business scenarios, and the explicit out-of-scope list come from [README.md](../../README.md) and [AGENTS.md](../../AGENTS.md). Brownfield context, file-level gaps, and locked-in assumptions come from [discovery.md](../../discovery.md) (referenced below as `G1–G11`, `A1–A7`, `Q1–Q5`).

## Core Principles

### I. Code Quality

**Typed boundaries.** TypeScript strict mode is on; `any` is forbidden anywhere under `backend/src` or `frontend/src`. `unknown` is permitted only at validation boundaries where Zod immediately narrows it. ES Module syntax everywhere (matches `"type": "module"` in both `package.json` files). The frontend `services/api.ts` types mirror the backend's exported types — no parallel definitions that can drift.

**Structure.** Express handlers in [backend/src/api/rooms.ts](../../backend/src/api/rooms.ts) parse, dispatch, and serialize only. All mutation logic lives in [backend/src/services/roomStore.ts](../../backend/src/services/roomStore.ts) as small, individually testable functions (`startRound`, `submitGuess`, `appendStroke`, `clearStrokes`, `restartRoom`). React code is functional components and standard hooks only; one reusable polling hook (`useRoomPolling`); no new state-management or routing libraries beyond the starter (React Router v6, the existing `RoomStore` over `useSyncExternalStore`).

**Determinism over cleverness.** Game rules are pure functions of (room state, request payload). RNG is forbidden inside game logic — word selection, drawer assignment, scoring, and any tie-breaking must be reproducible by inspection. Room **code** generation may use RNG because a code is identity, not gameplay. Concrete formulas (`A1` word selection, `A2` drawer assignment, `A3` scoring termination) live in [discovery.md](../../discovery.md) and are cited verbatim by the relevant spec.

**Brownfield discipline.** Edit existing files; do not rewrite or rename when an edit will do. Unrelated refactors are out of scope. New runtime dependencies require a documented justification inside the relevant `spec.md`; the forbidden list under "Non-Negotiable Constraints" overrides any AI suggestion.

**Snapshot purity (NON-NEGOTIABLE).** `toRoomSnapshot(room, viewerParticipantId)` is the single point that decides what each client may see. The secret word is `null` for everyone except the drawer (closes `G6`). No endpoint, helper, or future feature may bypass this serializer to ship a raw `Room` to a client.

### II. Testing Standards (NON-NEGOTIABLE)

**Baseline.** The starter tests stay green throughout the lab: [backend/src/services/roomStore.test.ts](../../backend/src/services/roomStore.test.ts), [backend/src/api/schemas.test.ts](../../backend/src/api/schemas.test.ts), [frontend/src/services/api.test.ts](../../frontend/src/services/api.test.ts). A scenario whose merge would break a starter test is incomplete.

**Coverage rules.** New code is covered by Vitest in the same commit that introduces it:

- Every new service helper in `roomStore.ts` lands with at least one happy-path and one rejection-path test. Pure helpers are the unit under test; handlers do not need integration tests.
- Every new Zod schema in `schemas.ts` lands with one positive and one negative test in `schemas.test.ts`.
- Every new endpoint client in `frontend/src/services/api.ts` lands with one Vitest case in `api.test.ts` asserting URL, method, and body shape.
- Drawer-only secret masking is asserted directly in `roomStore.test.ts` (drawer viewer sees `secretWord`; non-drawer viewer sees `null`).

**Test determinism.** Tests cannot depend on RNG, real timers, or wall-clock time. Where production code uses `Math.random` (room codes) the test asserts shape (`/^[A-Z0-9]{4}$/`) or passes a stub. Polling intervals in tests use Vitest fake timers, never real `setInterval`.

**Gating.** All four of `cd backend && npm run build`, `cd backend && npm test`, `cd frontend && npm run build`, `cd frontend && npm test` must succeed at every commit boundary. `node .github/scripts/pre-evaluation-check.mjs` must succeed before opening the PR. Two-tab manual validation against the spec's "Validation" section is required before closing a scenario's last task.

### III. User Experience Consistency

**One error surface.** Validation errors return HTTP `400` with the offending field named in the message. Unknown rooms return `404` with a non-technical message. Conflicts (cap exceeded, guess after round ended) return `409`. The frontend renders `error.message` through the existing `.form__error` class. No toast libraries, no global error overlay, no `alert()` or `confirm()`.

**One loading vocabulary.** Long-running operations route through the existing `isLoading` flag in [frontend/src/state/roomStore.ts](../../frontend/src/state/roomStore.ts). Buttons disable while their action is in flight; the label switches to a present-progressive form ("Refreshing…", "Starting…", "Joining…", "Submitting…"). No spinner libraries.

**Input hygiene is identical client and server.** All free-text inputs are `.trim()`ed before submit and before display. Empty/whitespace-only submissions are rejected client-side with the same message the backend would return, so the user does not see two different errors for the same problem. Player names are 1–24 characters after trimming (`A6`). Room codes are uppercased on input (matches the existing `JoinRoomPage` behavior) and on lookup ([backend/src/api/rooms.ts](../../backend/src/api/rooms.ts) already does this).

**Auto-sync over manual refresh.** Lobby and game pages poll automatically (Principle IV). Manual "Refresh" buttons are removed once polling lands; the only synchronous user actions are the ones the user initiated (create, join, start, guess, draw, restart). A small "Updated Xs ago" indicator is acceptable; a refresh button is not.

**Role clarity.** The viewer's role (host, drawer, guesser) is visible on every page where it changes the available actions. Disabled buttons explain why with a single short line ("Need at least 2 players to start", "Only the host can restart"). Drawer-only controls (clear canvas) are hidden from guessers, not just disabled.

**Drawer-only word visibility.** The secret-word card renders only when `viewer.isDrawer`. Guessers see a "What's being drawn?" hint card instead. This is the UX face of Principle I's snapshot purity — if it ever shows up for a guesser, the bug is in `toRoomSnapshot`, not in the page.

### IV. Performance Requirements

**Polling cadence.** All cross-client sync is HTTP polling at 2000 ms ± 100 ms (`A5`). The shared `useRoomPolling` hook pauses when `document.visibilityState !== "visible"` so background tabs do not hammer the in-memory store. Per-page intervals are forbidden — there is exactly one polling hook in the app.

**Payload bounds.** Snapshots stay small enough to send every 2 s without strain. Caps are enforced server-side; clients also enforce client-side to keep the UI honest:

- Participants per room: soft cap 8 (`Q4`). Join past the cap is rejected with `409`.
- Strokes per round: soft cap 500. Additional `POST /rooms/:code/strokes` calls past the cap are rejected with `409`.
- Guesses per round: soft cap 200. Same treatment.
- Stroke points per stroke: soft cap 250. The client decimates pointer samples before sending.

**Algorithmic cost.** Every endpoint is O(P + S + G) where P = participants, S = strokes, G = guesses in the target room. No endpoint scans the full `rooms` Map. No endpoint allocates a new list per participant per request beyond what the snapshot already contains.

**Local response budget.** With an in-memory store, every endpoint should return in well under 50 ms p95 on a local dev machine. If a change pushes a request beyond 50 ms, document why in the relevant `plan.md` and either revert or absorb it with a Constitutional exception.

**Frontend render.** The canvas redraws only when the snapshot's stroke list changes (compare by reference, then by length). Lists (participants, scoreboard, guess history) render with stable `key` props from the backend (`participant.id`, `guess.id`). `setState` is not called in render paths.

**No real-time transports.** WebSockets, Socket.IO, SSE, and HTTP long-polling are forbidden under both this principle and the constraints below. Beyond the lab rules, they would invalidate the polling-budget reasoning above and trip the precheck regex.

## Non-Negotiable Constraints

The following are forbidden anywhere in `backend/src`, `frontend/src`, or as direct dependencies in either `package.json`. The scanner in [.github/scripts/pre-evaluation-check.mjs](../../.github/scripts/pre-evaluation-check.mjs) (lines 246–269) enforces this; any match fails the PR.

- **Real-time transports**: WebSockets, `socket.io`, `ws`, `wss://`, SSE, long-polling.
- **Persistence layers**: `sqlite`, `postgres`/`postgresql`, `mysql`, `mongodb`, `mongoose`, `prisma`, `typeorm`, `sequelize`, `knex`, `redis`.
- **Auth/sessions**: `jwt`, `jsonwebtoken`, `passport`, `oauth`, `firebase/auth`.
- **Gameplay extensions** out of scope per README: multi-round logic, drawer rotation, timers, countdowns, speed bonuses, drawer bonuses, custom or random word packs, spectator mode, kick/mute, room passwords, invite links.
- **Tooling drift**: new runtime dependencies without a documented justification in the relevant `spec.md`; rewriting or renaming existing starter files where an edit would do; reformatting unrelated files.

## Development Workflow & Review

### AI Usage Rules

- **AI-1. AI is a drafter, not an author.** Every AI-generated spec, plan, task, or code change is reviewed by the human before commit. The reviewer owns the contents.
- **AI-2. Constitution-first prompting.** Every `/speckit.*` invocation must reference this file. Spec prompts must additionally cite the relevant `discovery.md` IDs so the AI works from settled context rather than re-deriving it.
- **AI-3. No silent dependency additions.** If the AI proposes a new package, the diff is discussed and justified in the spec before merge. The forbidden list above overrides any AI suggestion.
- **AI-4. No fabricated paths or APIs.** AI output that references a file or function must match the repo at the commit it lands in. Hallucinated references are a review-time blocker.
- **AI-5. Determinism over cleverness.** When the AI offers a hash-based or RNG-based solution where a simpler deterministic one will do, the simpler one wins.
- **AI-6. Reflection log.** [reflection.md](../../reflection.md) records, per scenario, what the AI got right, what was rewritten, and why. This is the audit trail required by the rubric.

### Review Discipline

- **R1.** Self-review before commit: re-read the diff against the relevant `spec.md` acceptance criteria.
- **R2.** Two-tab manual validation for each scenario before closing its last task, following the steps in that spec's "Validation" section.
- **R3.** `node .github/scripts/pre-evaluation-check.mjs` is run locally before opening the PR; every reported failure resolved and every size warning addressed.
- **R4.** Spec drift is a bug. If implementation diverges from a spec, the spec is updated in the same commit and the divergence noted in `reflection.md`. Code and spec agree at every commit boundary.

### Definitions

- **Scenario.** A README "Business Scenario" (1–4). Each maps to exactly one `specs/NNN-*/` folder.
- **Round.** One game session inside a room: drawer assigned, word chosen, strokes drawn, guesses submitted, result rendered, then either restart or idle.
- **Viewer.** The participant identified by the `participantId` query parameter on `GET /rooms/:code`.
- **Host.** The participant who created the room. Tracked as `room.hostParticipantId`. Permissions: start round, restart round.
- **Drawer.** For round N, the participant at `room.participants[0]` per `A2`. Sole viewer authorized to call `/strokes` and `/strokes/clear`. Sole viewer who receives a non-null `secretWord` in the snapshot.

## Governance

This constitution supersedes ad-hoc preferences and any conflicting instruction from an AI assistant. PRs and self-reviews must verify compliance against the four core principles and the non-negotiable constraints.

Amendments require a commit that touches `.specify/memory/constitution.md` plus a one-paragraph note in `reflection.md` explaining the change and which scenario triggered it. The version footer below is bumped on every amendment using semantic versioning: MAJOR for principle removal, reversal, or replacement of the principle set; MINOR for added principles or sections; PATCH for clarifications and wording fixes.

Complexity that violates a principle is allowed only via an explicit **Constitutional exception** subsection in the spec where it lands, with rationale, scope, and a sunset condition (when the exception ends).

**Version**: 2.0.0 | **Ratified**: 2026-06-03 | **Last Amended**: 2026-06-03
