# Implementation Plan: Game Start, Drawer Selection & Secret Word Reveal

**Branch**: `002-game-start-word-reveal` | **Date**: 2026-06-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-game-start-word-reveal/spec.md`

## Summary

When the host starts the game, the room transitions from `lobby` to `playing` and the **first round** is created: the host (the first player) becomes the single, clearly-identified drawer, and a secret word is chosen **deterministically** from the existing starter word list by seeding on `roomCode + roundNumber`. The secret word is **withheld from guessers' data** entirely — the server returns the full word only to the drawer and a concealed (blanks) form to everyone else. Player names are **validated**: trimmed of surrounding whitespace, with empty/whitespace-only names rejected with a clear message. If the drawer/host leaves after the round begins, the room closes (the existing lobby host-departure rule already does this). All state stays in the in-memory `roomStore`; no new transport, storage, or dependencies. Scope ends at the first round's drawer designation and word reveal — no rotation, timers, scoring, or canvas.

## Technical Context

**Language/Version**: TypeScript — Node.js (Express) backend, React 18 frontend; versions per existing `package.json`. No upgrades.

**Primary Dependencies**: Backend — Express, Zod (existing). Frontend — React, React Router, Vite (existing). **No new dependencies.**

**Storage**: In-memory `Map<code, Room>` in `backend/src/services/roomStore.ts` only (Constitution IV). No DB/file/cache.

**Testing**: Vitest (backend unit tests for `roomStore` and `schemas`; frontend `api.test.ts`). Manual two-browser acceptance is the primary gate (Constitution: Technology Constraints).

**Target Platform**: Local dev — backend `http://localhost:3001`, frontend Vite dev server; modern browsers.

**Project Type**: Web application (separate `backend/` + `frontend/`).

**Performance Goals**: Round start visible to all players within ~2s (one poll cycle, SC-001). Role/word reveal understood within 5s (SC-007).

**Constraints**: REST polling only — round start is observed via the existing `GET /rooms/:code` poll that already flips `status` to `playing` (Constitution III). No WebSockets/streaming/push, no server-side timers. Word selection is **deterministic** (seeded, not random) so it is reproducible/testable (SC-005). Secret word must never appear in any guesser's response body (FR-007, SC-003).

**Scale/Scope**: Small party game — up to 8 players/room. First round only; single-process in-memory store.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Brownfield Respect | ✅ PASS | Extends existing `roomStore.startGame`, `toRoomSnapshot`, `Room`/`RoomSnapshot` models, `GamePage`, and create/join validation. No rewrite. Builds directly on feature 001's `playing` transition. |
| II. Spec-Driven Increments | ✅ PASS | Following specify → clarify → plan for one business scenario (Game Start & Drawer Flow — the 2nd scenario in the constitution's order). Every change traces to an FR. |
| III. Polling, Not Real-Time | ✅ PASS | Round start propagates through the existing ~2s `GET /rooms/:code` poll (already flips to `playing`). No new transport; no server timers. |
| IV. Strict Scope Discipline | ✅ PASS | In-memory only; no auth; no new dependency. Explicitly NOT building: multiple rounds, drawer rotation, timers, scoring, the canvas, custom word packs. Only round **1** is created. |
| V. Self-Review Before Commit | ⚠️ PASS (note) | Trim/empty-check on names added (Constitution V.2). **Intentional behavior change vs. feature 001**: empty names are now *rejected* rather than silently defaulted to `"Player"` (spec US3/FR-010). This supersedes the 001 default; any 001 acceptance step that relied on the empty→"Player" default must be re-validated. Documented in research.md. No other regressions. |

**Gate result: PASS.** No constitution violations → Complexity Tracking table intentionally empty.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-word-reveal/
├── plan.md              # This file
├── research.md          # Phase 0 — technical decisions
├── data-model.md        # Phase 1 — entities, fields, state transitions
├── quickstart.md        # Phase 1 — run & two-browser validation
├── contracts/
│   └── rooms-api.md     # Phase 1 — REST contract deltas (snapshot shape, start, name 400)
├── checklists/
│   └── requirements.md  # Spec quality checklist (from /speckit-specify)
└── tasks.md             # Phase 2 — created by /speckit-tasks (NOT here)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts          # MODIFY: validate non-empty name on create/join (400 + clear message)
│   │   ├── router.ts         # (unchanged) existing ZodError/HttpError handlers reused
│   │   └── schemas.ts        # MODIFY: trim playerName; require non-empty
│   ├── models/
│   │   └── game.ts           # MODIFY: add Round; Room.round; RoomSnapshot.round (viewer-aware: word for drawer, wordLength for all)
│   ├── services/
│   │   ├── roomStore.ts      # MODIFY: startGame creates round 1 (drawer = host); deterministic word pick; toRoomSnapshot withholds word from guessers; drop full availableWords from snapshot
│   │   └── wordSelection.ts  # NEW (small pure helper): selectWord(code, roundNumber) → deterministic index into STARTER_WORDS
│   └── seed/starterData.ts   # (unchanged) STARTER_WORDS reused
└── src/**/*.test.ts          # EXTEND: roomStore (round creation, drawer=host, word secrecy, determinism), wordSelection, schemas (name rejection)

frontend/
├── src/
│   ├── pages/
│   │   ├── GamePage.tsx       # MODIFY: show drawer badge for all; drawer sees secret word; guessers see blanks; identify viewer role
│   │   ├── CreateRoomPage.tsx # MODIFY: block empty-name submit with a clear message (client guard)
│   │   └── JoinRoomPage.tsx   # MODIFY: block empty-name submit with a clear message (client guard)
│   └── services/api.ts        # MODIFY: RoomSnapshot types — add round { number, drawerId, wordLength, word? }
└── src/**/*.test.ts          # EXTEND: api types/round shape if covered

CLAUDE.md                      # MODIFY: SPECKIT block → point to this plan
```

**Structure Decision**: Web application (Option 2). Reuse the existing `backend/` + `frontend/` layout. One small new backend file (`wordSelection.ts`) — a pure, dependency-free helper kept separate so the determinism of selection is independently unit-testable; it is not a new dependency or top-level directory. All room/game state remains in `roomStore.ts` (Constitution: State boundary); frontend state stays derived from polling.

## Complexity Tracking

> No constitution violations — no entries required.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _(none)_ | — | — |

## Phase 0 — Research

See [research.md](./research.md). Decisions: deterministic word selection (seed = `code + roundNumber`, stable hash → index), drawer = host for round 1, viewer-aware snapshot to enforce word secrecy server-side, concealed representation = one blank per letter (length only), name rejection superseding the 001 empty→"Player" default, and reuse of the existing poll for round-start propagation. No remaining NEEDS CLARIFICATION.

## Phase 1 — Design & Contracts

- [data-model.md](./data-model.md) — `Round` entity, `Room.round`, viewer-aware `RoomSnapshot.round` (drawer-only `word`, guesser-facing `wordLength`/`maskedWord`), per-round participant role derivation, name-validation rules, and the lobby → playing(round 1) → closed transitions with FR traceability.
- [contracts/rooms-api.md](./contracts/rooms-api.md) — REST deltas: viewer-aware `GET /rooms/:code` and `POST /rooms/:code/start` response shapes (round block; word present only for drawer), and the new `400` name-required response on `POST /rooms` and `POST /rooms/:code/join`.
- [quickstart.md](./quickstart.md) — run both servers + two-browser acceptance script mapped to US1/US2/US3 (verify drawer badge for all, drawer-only word, guesser blanks, determinism, name rejection).
- Agent context: `CLAUDE.md` SPECKIT block updated to reference this plan.

**Post-Design Constitution Re-Check: PASS** — design adds no dependencies, no transport, no persistence; reuses the existing start endpoint and poll; one pure helper file; word secrecy enforced at the snapshot boundary.
