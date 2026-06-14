# Implementation Plan: Result, Restart & Final Validation

**Branch**: `scribble-lab` *(spec directory `004-result-restart`)* | **Date**: 2026-06-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-result-restart/spec.md`

## Summary

Feature 003 left the room in a perpetual `round` state — guesses accumulate forever, scores never crystallise, and the secret word stays drawer-only until the process restarts. This feature closes the loop:

1. **New room lifecycle state `"result"`** — exists between `"round"` and the next `"lobby"`. Reached via a host-only `POST /rooms/:code/end`. Once a room is in `"result"`, every viewer sees the cleartext `secretWord` (final reveal), the locked-in final `scores`, and the full ordered `guesses` history. Guess submission is rejected with `409`.
2. **Host-only restart** — `POST /rooms/:code/restart` transitions `"result" → "lobby"`. The `round` field is set to `null`, `participants[].isDrawer` becomes `false` for everyone, the host and participant order are preserved. The next Start Game (feature 002) is a fresh round with zeroed scores.
3. **Frontend Result view** — a new `ResultView` component renders when `room.status === "result"`, showing the round-ended banner, scoreboard, and read-only feed. The host's tab also surfaces a **Restart** button; non-hosts see nothing extra. During `"round"`, the drawer's tab also gains an **End Round** button.
4. **Server is authoritative** — host gating, state-transition validity, and idempotency are all enforced server-side; the frontend's only job is to hide / show the two new buttons.

This is a **pure extension** on top of features 001 + 002 + 003: no new transport, no new dependencies, no schema migration (state is still in-memory `Map<string, Room>`). The polling channel from feature 001 carries every transition within ≤ 2 s.

## Technical Context

**Language/Version**: Node.js 20 + TypeScript 5 on the backend; React 18 + TypeScript on the frontend (unchanged from features 001–003).

**Primary Dependencies**: Express, Zod, `tsx` (backend); React 18, React Router v6, Vite, Vitest (frontend). **No additions.**

**Storage**: In-memory `Map<string, Room>` on the backend (unchanged). Restart deletes the `Round` instance entirely; the `Room` itself stays in the Map.

**Testing**: Vitest in both packages. Service-layer unit tests (`roomStore.test.ts`) + Express integration tests via `fetch` against a live `app.listen` (`rooms.test.ts`) + React component tests via `react-dom/client` + `act()` (the pattern already used by `GuessPanel.test.tsx` and `RoundView.test.tsx`).

**Target Platform**: Backend on `http://localhost:3001`, frontend dev server on `http://localhost:5173`. Modern evergreen browsers.

**Project Type**: Web application (monorepo with `backend/` + `frontend/` packages).

**Performance Goals**: Polling cadence stays at ~2 s (visibility-aware). End-round → all-tabs-show-result propagation observed in ≤ 2 s in 9 of 10 trials on localhost (SC-001). Server-side handler latency ≤ 100 ms p95 on localhost (SC-006).

**Constraints**: No WebSockets/SSE, no DB, no auth (per Constitution §I, §II). No new top-level dependencies (per Constitution §IV). All wire types mirrored across `backend/src/models/game.ts` ↔ `frontend/src/services/api.ts`. The `"result"` status is the only structural change to the room shape vs. feature 003.

**Scale/Scope**: 2–6 participants per room; round closes after one End Round call. No accumulation across rounds (Restart wipes scores; see Constitution §I — no multiple-round mechanic).

## Constitution Check

| Principle | Status | Notes |
|---|---|---|
| **I. Lab-Scope Discipline** | PASS | Single-round semantics preserved. Restart returns the room to the lobby and discards round state — explicitly not "round 2 with carry-over scores". No timer, no rotation, no bonus. |
| **II. Polling-Only, In-Memory, Stateless** | PASS | Both new endpoints are plain `POST`. Transition propagation rides the existing `GET /rooms/:code` polling channel. State stays in the in-memory `Map`. |
| **III. TypeScript-First with Zod-Validated Boundaries** | PASS | Two new Zod schemas — `endRoundSchema` and `restartRoomSchema` — both validate `{ participantId: string.min(1) }`. The `RoomStatus` union gains `"result"` and is mirrored to the frontend. |
| **IV. Extend, Don't Replace** | PASS | Extends `Room.status`, adds two routes, adds two service functions (`endRound`, `restartRoom`). Reuses `toRoomSnapshot` (the only change: drop the drawer-gated `secretWord` filter when `status === "result"`). Reuses `GuessPanel` for the read-only feed + scoreboard in the Result view. No new top-level dependencies. |
| **V. Spec-First, Traceable Slices** | PASS | Every FR-### in `spec.md` is referenced by at least one task in the upcoming `tasks.md`, with exact file paths. Tests are mandatory for FR-002 / FR-004 / FR-005 / FR-006 / FR-007. |

**Gate verdict**: PASS. No DEVIATE rows; Complexity Tracking remains empty.

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart/
├── plan.md              # This file
├── research.md          # Phase 0 (decisions log — no open clarifications)
├── data-model.md        # Phase 1 (state machine + entity diffs)
├── quickstart.md        # Phase 1 (two-tab walkthrough + curl variants)
├── contracts/
│   └── rooms-api.md     # Phase 1 (new endpoints + status code matrix)
├── checklists/
│   └── requirements.md  # Generated by /speckit.specify (all green)
└── tasks.md             # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
└── src/
    ├── models/
    │   └── game.ts                       # EXTEND: RoomStatus union gains "result"
    ├── services/
    │   ├── roomStore.ts                  # EXTEND: endRound(), restartRoom(); toRoomSnapshot reveals secretWord in "result"
    │   └── roomStore.test.ts             # EXTEND: state-machine, host gating, idempotency, snapshot reveal
    ├── api/
    │   ├── rooms.ts                      # EXTEND: POST /rooms/:code/end + POST /rooms/:code/restart routes
    │   ├── rooms.test.ts                 # EXTEND: integration tests for both new endpoints (200/403/404/409)
    │   ├── schemas.ts                    # EXTEND: endRoundSchema, restartRoomSchema (both reuse { participantId })
    │   └── schemas.test.ts               # EXTEND: parse + reject cases

frontend/
└── src/
    ├── services/
    │   ├── api.ts                        # EXTEND: RoomStatus union; api.endRound(), api.restartRoom()
    │   └── api.test.ts                   # EXTEND: request shape + error mapping for both
    ├── state/
    │   └── roomStore.ts                  # EXTEND: endRound(), restartRoom() methods (mirror startRoom())
    ├── components/
    │   ├── RoundView.tsx                 # EXTEND: render End Round button for the host viewer
    │   ├── ResultView.tsx                # NEW: round-ended banner + word + scoreboard + read-only feed + Restart (host)
    │   ├── ResultView.test.tsx           # NEW: viewer-agnostic banner, host-only Restart, no input/canvas
    │   └── GuessPanel.tsx                # EXTEND (optional, additive prop): `readOnly` to suppress input even for non-locked guessers
    └── pages/
        └── LobbyPage.tsx                 # EXTEND: switch on room.status — lobby / round / result
```

**Structure Decision**: Keep the established `backend/` ↔ `frontend/` monorepo layout (per Constitution §IV — module layout is fixed). One new component file (`ResultView.tsx`), one optional additive prop on `GuessPanel` (`readOnly`). No new directories. No new dependencies.

## Complexity Tracking

> Fill only if Constitution Check has DEVIATE rows.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _(none)_  | _(none)_   | _(none)_                            |

## Implementation Phases (high level — exact tasks land in `tasks.md`)

### Phase A — Foundation (state machine, no UX yet)

- Extend `RoomStatus` to `"lobby" | "round" | "result"` in both packages.
- Update `toRoomSnapshot`: when `room.status === "result"`, every viewer sees `round.secretWord` (drop the drawer-only filter). All other fields unchanged.
- No new endpoints yet; ensure existing tests still pass.

### Phase B — US1: End Round → Result state

- Backend: `endRoundSchema` (Zod), `endRound(code, participantId)` service function (host check, status check, idempotency in `"result"`), `POST /rooms/:code/end` route with 200 / 403 / 404 / 409 envelope.
- Backend: `submitGuess` now returns `no_round` when `status === "result"` (it already returns `no_round` when `round === null` — extend the guard to `status !== "round"`).
- Backend tests: 200 happy path, 403 non-host, 404 unknown room, 409 lobby-state, 409 already-in-result (becomes idempotent 200), guess-during-result returns 409.
- Frontend: `api.endRound()`, `roomStore.endRound()`, **End Round** button visible only when `room.status === "round"` AND viewer is host. New `ResultView` component renders when `room.status === "result"`.
- Frontend tests: button visibility, ResultView renders banner + word + scoreboard + feed; no input, no canvas.

### Phase C — US2: Host Restart → Lobby

- Backend: `restartRoomSchema` (Zod), `restartRoom(code, participantId)` service function (host check, status check, idempotency in `"lobby"`), `POST /rooms/:code/restart` route with 200 / 403 / 404 / 409 envelope.
- Backend: on success, `room.round = null`, `room.status = "lobby"`, participants array untouched (incl. `hostParticipantId`).
- Backend tests: 200 happy path, 403 non-host, 404 unknown room, 409 from `"round"`, 409→200 idempotency from `"lobby"`, restart-then-start produces a fresh round with `scores={0,0}` and `guesses=[]`.
- Frontend: `api.restartRoom()`, `roomStore.restartRoom()`, **Restart** button visible only when `room.status === "result"` AND viewer is host. After click, the polling cycle pulls the new lobby snapshot and the `ResultView` unmounts.
- Frontend tests: button visibility; clicking Restart calls the store method.

### Phase D — Polish

- README "Implemented today (Scenario 4 — Result, Restart & Final Validation)" section + endpoint list.
- `CLAUDE.md` plan pointer (auto-updated by this command).
- Manual quickstart pass with two browser tabs.
- Verify the full game loop end-to-end: create → join → start → guess → end → restart → start again.

## Open Policy Decisions (carried forward from `spec.md`)

All three are already pinned in the spec's *Assumptions* section. No clarification round needed:

1. **Round-end trigger**: host-explicit only (no auto-end-on-first-correct-guess).
2. **Result-state word visibility**: revealed to **everyone**.
3. **Restart semantics**: discards round state; participants + host preserved; scores **not** cumulative across rounds.
