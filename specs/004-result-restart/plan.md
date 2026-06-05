# Implementation Plan: Result, Restart & Final Validation

**Branch**: `004-result-restart` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-result-restart/spec.md`

## Summary

Scenario 4 closes the game loop. We add a third room status **`result`** and two host-only
actions: **end round** (`POST /rooms/:code/end`) moves `playing → result`, and **restart**
(`POST /rooms/:code/restart`) moves `result → lobby`, preserving participants and host while
clearing all round state (drawer, secret word, guesses, drawing) and resetting scores to 0. In
the result state the snapshot **reveals the secret word to everyone** and shows correct guesses'
text (the word is now public), and exposes `canEndRound`/`canRestart` for host-only gating. The
existing ~2s polling carries every player to the result view when the round ends and back to the
lobby on restart. On the frontend we add a **Result screen**, an End-Round control on the game
screen (host only), and a Restart control on the result screen (host only). No new dependencies;
all changes extend existing files plus one new page.

## Technical Context

**Language/Version**: TypeScript (ES Modules). Node.js 18+ backend, React 18 frontend.

**Primary Dependencies**: Backend — Express, Zod, `tsx`, `node:crypto`. Frontend — React 18,
React Router 6, Vite. No new runtime dependencies.

**Storage**: In-memory only (`Map<string, Room>` in `services/roomStore.ts`).

**Testing**: Vitest. Extend `roomStore.test.ts` (end/restart transitions, host-only, state
clearing, score reset, word reveal at result), `schemas.test.ts` (end/restart bodies). Manual
two-tab validation per quickstart (the full end-to-end loop).

**Target Platform**: Local dev — backend `:3001`, frontend `:5173`.

**Project Type**: Web application (Express backend + React frontend monorepo).

**Performance Goals**: Result and lobby transitions reach all players within ~2s via polling.

**Constraints**: No WebSockets/DB/auth (constitution II); HTTP polling only. Deterministic
lifecycle (constitution III). In-memory state. Host-only lifecycle controls.

**Scale/Scope**: Small rooms, single round. ~4 backend files and ~5 frontend files (incl. one new
page) touched.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. TypeScript-First & Type Safety | Fully typed; no `any`; Zod at boundaries; centralized errors; UI tolerant | PASS — `result` status + flags typed; end/restart use Zod bodies; result reveal is server-side |
| II. Architectural Constraints | No WebSockets/DB/auth; polling; in-memory | PASS — result/restart transitions ride existing poll; state in `Map`; two REST endpoints only |
| III. Deterministic Game Rules | Predictable lifecycle | PASS — host-only end/restart; restart clears round + resets scores to 0 deterministically |
| IV. Spec-Driven Workflow | Traces to spec | PASS — see Requirements Traceability |
| V. Disciplined AI Usage & Self-Review | Granular commits, consistent structure | PASS — confined to api/services/models + pages/components + one new page |
| VI. Testing & Validation Discipline | Unit tests for deterministic logic; two-tab; builds | PASS — see Testing Strategy |

**Out-of-scope guard**: No timers/auto-end, no multiple rounds / rotation / round numbering.
Confirmed against README "Explicitly Out Of Scope".

**Result**: PASS. No violations; Complexity Tracking not required.

## Findings (Discovery)

Building on Scenarios 1–3:

1. **No result status** — `RoomStatus = "lobby" | "playing"`; there is no `result` state, so a
   round cannot end into a shared summary.
2. **No end/restart actions** — there is nothing to end a round or to reset back to the lobby.
3. **Word is drawer-only with no reveal path** — `toRoomSnapshot` returns `secretWord` only to the
   drawer and strips correct-guess text from others; the result must flip this to public.
4. **Result UI is a placeholder** — `components/ResultPanel.tsx` shows a static "activity" card;
   there is no result screen, no scoreboard reveal, no restart control.
5. **GamePage has a stray Exit-to-lobby button** — it navigates to `/lobby` while `playing`, which
   the lobby's poll bounces back; end/restart should be the real lifecycle controls.

Relevant files: `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`,
`backend/src/api/rooms.ts`, `backend/src/api/schemas.ts`, `frontend/src/services/api.ts`,
`frontend/src/state/roomStore.ts`, `frontend/src/routes/index.tsx`,
`frontend/src/pages/GamePage.tsx`, and a new `frontend/src/pages/ResultPage.tsx`.

## State Model Changes

**Backend `RoomStatus`**: `"lobby" | "playing" | "result"`.

**Backend `Room`**: no new fields. `endRound` sets `status = "result"` (round data retained for
display). `restartRound` sets `status = "lobby"`, `drawerId = null`, `secretWord = null`,
`guesses = []`, `drawing = null`, and resets `scores[p.id] = 0` for every participant; participants
and `hostId` are preserved.

**Backend `RoomSnapshot`** (add): `canEndRound: boolean` (`isHost && status === "playing"`),
`canRestart: boolean` (`isHost && status === "result"`). **Reveal at result**: `secretWord` is
returned to all viewers when `status === "result"` (not only the drawer); correct-guess `text` in
`guesses` is shown to all when `status === "result"`.

**Frontend `RoomSnapshot`** (`services/api.ts`): mirror `status` union + `canEndRound`/`canRestart`.
Add `api.endRound`/`api.restartRound` and `store.endRound`/`store.restartRound`.

## Data Flow

1. **End round** → host (with `canEndRound`) clicks End Round → `POST /rooms/:code/end
   { participantId }` → backend verifies host + `status === "playing"` → sets `status = "result"`
   → returns snapshot (word now public).
2. **Result sync** → next ~2s poll returns `status === "result"` → GamePage navigates everyone to
   `/result`; the result view shows the correct word, final scores, and full guess history.
3. **Restart** → host (with `canRestart`) clicks Restart → `POST /rooms/:code/restart
   { participantId }` → backend verifies host + `status === "result"` → clears round state, resets
   scores, sets `status = "lobby"` → returns snapshot.
4. **Lobby sync** → next ~2s poll returns `status === "lobby"` → ResultPage navigates everyone to
   `/lobby`; the lobby behaves as a fresh game (host can start again with ≥2 players).

## Requirements Traceability

| Spec | Plan element |
|------|--------------|
| FR-001, FR-002 | `POST /rooms/:code/end`; `endRound` requires host + `playing` |
| FR-003 | snapshot reveals `secretWord` to all when `status === "result"` |
| FR-004 | `scores` already in snapshot (Scenario 3); shown on result screen |
| FR-005 | snapshot shows correct-guess `text` to all when `status === "result"` |
| FR-006 | poll detects `result` → GamePage auto-navigates to `/result` |
| FR-007 | `POST /rooms/:code/restart`; `restartRound` requires host + `result` |
| FR-008 | restart keeps `participants` + `hostId` untouched |
| FR-009 | restart clears `drawerId`/`secretWord`/`guesses`/`drawing`, resets `scores` to 0 |
| FR-010 | poll detects `lobby` → ResultPage auto-navigates to `/lobby` |
| FR-011 | back in lobby, `canStart` logic (Scenario 1) applies unchanged |
| FR-012, FR-013, FR-014 | `canEndRound`/`canRestart` gate UI; endpoints reject non-host (403) |
| FR-015 | state in `Map` only |

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart/
├── plan.md            # This file
├── spec.md            # Feature spec
├── research.md        # Phase 0 output
├── data-model.md      # Phase 1 output
├── quickstart.md      # Phase 1 output
├── contracts/
│   └── rooms-api.md   # end + restart endpoints; result reveal in snapshot
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
backend/
└── src/
    ├── models/game.ts          # RoomStatus += "result"; snapshot canEndRound/canRestart
    ├── services/roomStore.ts   # endRound(); restartRound(); result-time word/text reveal in snapshot
    ├── api/schemas.ts          # endRoomSchema / restartRoomSchema (participantId)
    └── api/rooms.ts            # POST /rooms/:code/end ; POST /rooms/:code/restart

frontend/
└── src/
    ├── services/api.ts         # status union + canEndRound/canRestart; api.endRound/api.restartRound
    ├── state/roomStore.ts      # endRound(participantId); restartRound(participantId)
    ├── routes/index.tsx        # add /result route
    ├── pages/
    │   ├── GamePage.tsx        # host End-Round control; navigate to /result on status result
    │   └── ResultPage.tsx      # NEW — reveal word + final scores + full history; host Restart; poll
```

**Structure Decision**: Web-application layout (Option 2). One new page (`ResultPage`); everything
else extends existing files per `AGENTS.md`.

## Testing Strategy

- **Backend unit** (`roomStore.test.ts`): `endRound` requires host + `playing` (rejects non-host,
  not-playing); sets `status: "result"`; result snapshot reveals `secretWord` to a guesser and
  shows correct-guess text. `restartRound` requires host + `result`; sets `status: "lobby"`;
  clears drawer/word/guesses/drawing; resets every score to 0; preserves participants + host.
- **Backend unit** (`schemas.test.ts`): `endRoomSchema`/`restartRoomSchema` require `participantId`.
- **Manual two-tab (full loop / SC-008)**: create → join → start → guess/score → host ends →
  both see result (word + scores + history) within ~2s → host restarts → both back in lobby with
  players preserved and state cleared → host can start again.
- **Builds**: backend and frontend `npm run build` both pass.

## Risks & Mitigations

- **Word reveal correctness**: the word must become public only at `result`, not during play.
  Mitigation: gate the reveal on `status === "result"` in `toRoomSnapshot`; unit-test a guesser's
  snapshot in both `playing` (null) and `result` (revealed).
- **Incomplete state clearing**: a missed field on restart leaks last round's data. Mitigation:
  `restartRound` explicitly resets every round field + all scores; unit-test each.
- **Navigation loops**: result/lobby transitions must not bounce. Mitigation: GamePage routes to
  `/result` on `result` and `/lobby` on `lobby`; ResultPage routes to `/lobby` on `lobby` and
  `/game` on `playing`; each effect keyed on `status`.
- **Host-only enforcement**: end/restart must be server-enforced, not just hidden. Mitigation:
  endpoints verify `participantId === hostId` (403 otherwise).
- **Polling continuity**: ResultPage runs the same poller (start on mount / stop on unmount).

## Complexity Tracking

No constitutional violations. Section intentionally empty.
