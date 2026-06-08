# Implementation Plan: Round Result & Host Restart

**Branch**: `004-round-result-restart` | **Date**: 2026-06-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-round-result-restart/spec.md`

## Summary

The active round (feature 003) currently has no ending. This feature closes the loop with two new host-only action endpoints and a third room state. The host ends the active round via a **new `POST /rooms/:code/end`**, which transitions the room from `playing` to a new **`ended`** status. In the `ended` state, the viewer-aware snapshot **lifts feature 002/003's secrecy masking** — the secret `word` is revealed to *every* player and every guess (including correct ones) carries its `text` — so all players see the correct word, the final scores (already on `participants[].score`), and the full guess history (FR-003–FR-006). The host then restarts via a **new `POST /rooms/:code/restart`**, which returns the room to `lobby`, sets `round = null`, resets every `participant.score = 0`, and preserves the participant list and `hostId` (FR-009–FR-013). All propagation rides the existing ~2s `GET /rooms/:code` poll (Constitution III) — non-host players' polls pick up `ended` and `lobby` and navigate accordingly. A new **`ResultsPage`** at `/results` (mirroring the existing page-per-status pattern) reuses the existing `Scoreboard` and `ResultPanel` and adds a word reveal + host-only Restart button; `GamePage` gains a host-only "End Round" button and a navigate-on-`ended` effect. No new dependencies, no persistence, no timers.

## Technical Context

**Language/Version**: TypeScript — Node.js (Express) backend, React 18 frontend; versions per existing `package.json`. No upgrades.

**Primary Dependencies**: Backend — Express, Zod (existing). Frontend — React, React Router, Vite (existing). **No new dependencies.**

**Storage**: In-memory `Map<code, Room>` in `backend/src/services/roomStore.ts` only (Constitution IV). The `ended` state and the cleared lobby both live on the in-memory `Room`. No DB/file/cache.

**Testing**: Vitest (backend unit tests for `roomStore` end/restart transitions and the `ended`-state snapshot reveal; frontend `api.test.ts` for the new `endRound`/`restartGame` calls). Manual two-browser acceptance is the primary gate (Constitution: Technology Constraints).

**Target Platform**: Local dev — backend `http://localhost:3001`, frontend Vite dev server; modern browsers.

**Project Type**: Web application (separate `backend/` + `frontend/`).

**Performance Goals**: When the host ends the round, every other player enters the result state within one poll cycle (~2s, SC-003). After restart, every player returns to the lobby within one poll cycle (~2s, SC-004).

**Constraints**: REST polling only — the `ended` status and the return-to-`lobby` propagate via the existing `GET /rooms/:code` poll (Constitution III). `POST .../end` and `POST .../restart` are action endpoints (peers of the existing `/start` and `/guess`), not new transports. No server-side timers (round end is host-initiated; Clarifications 2026-06-08). The secret word is revealed **only** once the room is `ended`; the `playing`-state drawer-only/correct-guess masking from features 002/003 must remain intact.

**Scale/Scope**: Small party game — up to 8 players/room. Single round per game; restart returns to lobby (not a next round — multiple rounds remain out of scope, Constitution IV).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Brownfield Respect | ✅ PASS | Discovery pass completed over `roomStore.ts`, `game.ts`, `rooms.ts`, `schemas.ts`, `api.ts`, `state/roomStore.ts`, `GamePage.tsx`, `LobbyPage.tsx`, `routes.tsx`, `ResultPanel.tsx`, `Scoreboard.tsx` (findings in [research.md](./research.md)). Extends those files; **reuses** existing `Scoreboard` + `ResultPanel`. One new page (`ResultsPage.tsx`). No rewrite. |
| II. Spec-Driven Increments | ✅ PASS | specify → clarify → plan for the 4th scenario in the constitution's order (**Result, Restart & Final Validation**). Every change traces to an FR. |
| III. Polling, Not Real-Time | ✅ PASS | Result state + return-to-lobby sync through the existing ~2s `GET /rooms/:code` poll. `POST .../end` and `POST .../restart` are action endpoints (peers of `/start`, `/guess`), not new transports. No timers/streaming/push. |
| IV. Strict Scope Discipline | ✅ PASS | In-memory only; no auth; no new dependency; no DB. Restart returns to the **lobby** — explicitly NOT a next round, drawer rotation, timer, or persistent leaderboard. No host-transfer feature added (see Complexity note / research). |
| V. Self-Review Before Commit | ✅ PASS | Core is host-authorization + state-guard validation. **Regression-safe**: the snapshot reveal is gated on the new `ended` status, so `playing`/`lobby` projections are byte-for-byte unchanged; `/end` and `/restart` are additive endpoints. |

**Gate result: PASS.** No constitution violations → Complexity Tracking table intentionally empty.

## Project Structure

### Documentation (this feature)

```text
specs/004-round-result-restart/
├── plan.md              # This file
├── research.md          # Phase 0 — technical decisions + brownfield discovery findings
├── data-model.md        # Phase 1 — RoomStatus "ended", end/restart transitions, ended-state snapshot
├── quickstart.md        # Phase 1 — run & two-browser validation (end → results → restart)
├── contracts/
│   └── rooms-api.md     # Phase 1 — REST deltas (new POST .../end, POST .../restart; ended-state snapshot)
├── checklists/
│   └── requirements.md  # Spec quality checklist (from /speckit-specify + /speckit-clarify)
└── tasks.md             # Phase 2 — created by /speckit-tasks (NOT here)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts          # MODIFY: add POST /:code/end (403 not host, 409 not playing); POST /:code/restart (403 not host)
│   │   ├── schemas.ts        # MODIFY: reuse startRoomSchema shape (participantId) for end/restart, or add endRoundSchema/restartRoomSchema
│   │   └── router.ts         # (unchanged) existing HttpError/ZodError handlers reused
│   ├── models/
│   │   └── game.ts           # MODIFY: RoomStatus add "ended"
│   ├── services/
│   │   └── roomStore.ts      # MODIFY: endRound(code, pid); restartRoom(code, pid); reveal word + unmask guesses in toRoundSnapshot when status==="ended"
│   └── seed/starterData.ts   # (unchanged)
└── src/**/*.test.ts          # EXTEND: roomStore (end→ended, restart→lobby+scores 0+round null+players preserved, host-only, idempotent), ended-state snapshot reveal

frontend/
├── src/
│   ├── components/
│   │   ├── Scoreboard.tsx    # REUSE as-is (final scores render from participants[].score)
│   │   └── ResultPanel.tsx   # REUSE as-is (full guess history renders from round.guesses)
│   ├── pages/
│   │   ├── GamePage.tsx      # MODIFY: host-only "End Round" button (calls store.endRound); navigate("/results") when status==="ended"
│   │   └── ResultsPage.tsx   # NEW: poll loop; reveal round.word to all; Scoreboard + ResultPanel; host-only Restart; navigate("/lobby") on "lobby", "/" when no room
│   ├── routes.tsx            # MODIFY: add <Route path="/results" element={<ResultsPage />} />
│   ├── services/api.ts       # MODIFY: RoomStatus add "ended"; add api.endRound + api.restartGame
│   └── state/roomStore.ts    # MODIFY: add endRound() and restartGame() methods
└── src/**/*.test.ts          # EXTEND: api.test.ts (endRound/restartGame POST shapes)

CLAUDE.md                      # MODIFY: SPECKIT block → point to this plan
```

**Structure Decision**: Web application (Option 2). Reuse the existing `backend/` + `frontend/` layout and the State Boundary (all room/game state in `roomStore.ts`; frontend derived from polling). The one new frontend file (`ResultsPage.tsx`) follows the established **page-per-status** convention (`StartPage`/`LobbyPage`/`GamePage`), each navigated to on a status change observed via the poll. No new top-level directory, package, or backend helper module is required — the end/restart logic is a natural extension of the existing `startGame`/`submitGuess` functions in `roomStore.ts`.

## Complexity Tracking

> No constitution violations — no entries required.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _(none)_ | — | — |

## Phase 0 — Research

See [research.md](./research.md). Decisions: introduce a third `RoomStatus` value `ended` (vs. a separate boolean flag) so the existing page-per-status navigation pattern carries the result state for free; two host-only action endpoints `POST .../end` and `POST .../restart` (peers of `/start`); reveal the word and unmask guesses **conditionally on `status === "ended"`** inside the existing `toRoundSnapshot` (keeping `playing` projections unchanged — regression-safe); restart resets scores to 0 and nulls the round (Clarifications 2026-06-08); restart is **idempotent** (a restart from an already-`lobby` room is a no-op success). **Brownfield finding**: the codebase has no host-transfer — `closeIfEmptyOrHostGone` deletes the room when the host departs; the spec's host-transfer edge case is therefore satisfied by existing room-closure, and no new transfer mechanism is built (Constitution IV). No remaining NEEDS CLARIFICATION.

## Phase 1 — Design & Contracts

- [data-model.md](./data-model.md) — `RoomStatus` gains `"ended"`; the end/restart state transitions; the `ended`-state snapshot that reveals `word` to all viewers and includes `text` for all guesses; restart's clear/reset semantics (round null, all scores 0, participants + host preserved); FR traceability.
- [contracts/rooms-api.md](./contracts/rooms-api.md) — REST deltas: new `POST /rooms/:code/end` (200 + `403`/`409`/`404`) and `POST /rooms/:code/restart` (200 + `403`/`404`, idempotent), plus the `ended`-state shape of `GET /rooms/:code` (word + full unmasked history for everyone).
- [quickstart.md](./quickstart.md) — run both servers + two-browser acceptance script mapped to US1/US2/US3 (host ends round → all see word/scores/history within ~2s; host restarts → all return to a fresh lobby with players preserved and scores 0; non-host cannot end or restart).
- Agent context: `CLAUDE.md` SPECKIT block updated to reference this plan.

**Post-Design Constitution Re-Check: PASS** — design adds no dependencies, no transport, no persistence, no timers; sync stays on the existing GET poll; both new endpoints mirror the existing `/start` action; the word reveal is gated on the new `ended` status so prior-feature secrecy and projections are untouched; no host-transfer mechanism is introduced.
