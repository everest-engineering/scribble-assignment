# Implementation Plan: Result, Restart & Final Validation

**Feature**: Group 4 — Scenario 4 (Result, Restart & Final Validation)

**Branch**: `004-result-restart` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

**Status**: Draft

**Constitution**: Compliant with `.specify/memory/constitution.md` — brownfield extension, HTTP polling
only, in-memory store, no auth, Zod at the boundary, deterministic rules, server-side viewer projection.

## Summary

Close the game loop. When `round.ended` is true (set by Group 3 on the first correct guess), the server
snapshot reveals `secretWord` to **every** viewer (drawer-only while active), and the game screen renders
a result view: revealed word, final scores, full guess history, with all play controls locked. The host
can restart via `POST /rooms/:code/restart` (`{ participantId }`), which flips `status` back to `"lobby"`,
clears `round` to `null`, and preserves participants + host. Non-host or not-yet-ended restart attempts are
rejected; restart is idempotent once already in lobby. Game-screen polling (Group 3) drives auto-navigation
back to `/lobby` when status becomes `lobby`, mirroring Group 1's lobby→game navigation. After restart, the
existing Group 1–2 start path produces a fresh round. No new dependencies, no rewrites.

> **Builds on Groups 1–3**: `Room.status` (`lobby`/`started`), `Room.round` (`RoundState` with `ended`),
> viewer-aware `toRoomSnapshot`, host-only `startRoom`, game-screen polling, and `/lobby`+`/game` routes
> all already exist. Group 4 adds the reveal rule, the restart action, the result UI, and game→lobby
> auto-navigation.

## 1. Technical Context

### Tech stack (unchanged — no new dependencies)

| Layer | Technology |
|-------|------------|
| Frontend | React 18, React Router v6, Vite, TypeScript (strict) |
| Frontend state | `RoomStore` via `useSyncExternalStore` (`frontend/src/state/roomStore.ts`) |
| Backend | Node.js, Express, TypeScript (ESM), `tsx` for dev |
| Validation | Zod (`backend/src/api/schemas.ts`) |
| Storage | In-memory `Map<string, Room>` (`backend/src/services/roomStore.ts`) |
| Sync | HTTP polling every ~2s (`GET /rooms/:code`) — reused from Groups 1–3 |

**Target Platform**: Local dev — backend `http://localhost:3001`, frontend `http://localhost:5173`.

**Testing**: Extend `roomStore.test.ts`, `schemas.test.ts`, `api.test.ts`.

**Scale/Scope**: Classroom-scale rooms; single round per session.

### Constraints (from constitution)

- **No WebSockets** — result/restart converge via snapshot polling only.
- **No database** — restart clears the in-memory `round`; backend restart still loses all rooms.
- **No auth** — restart gating uses `hostId`, not credentials.
- **Validate at the boundary** — restart payload validated with Zod.
- **Server is source of truth** — reveal, restart, and state reset are authoritative server-side.
- **Stay in scope** — no multiple rounds, drawer rotation, timers, or persistence.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Extend, Don't Replace | Reuse status/round/store/router/components; no new deps | PASS |
| II. Spec-Driven & Traceable | Every change maps to FR-049…FR-062 | PASS |
| III. Deterministic Game Rules | Reveal/reset are pure state transitions; no randomness | PASS |
| IV. Validation at Edge | Zod `restartSchema`; host + ended gates server-side; reveal in projection not UI-only | PASS |
| V. Stay In Scope | No multi-round/rotation/timers/persistence; restart returns to existing lobby | PASS |

No violations. Complexity Tracking omitted.

## 2. Findings (current state after Group 3)

| Finding | Evidence | Implication for Group 4 |
|---------|----------|-------------------------|
| Word is drawer-only always | `toRoomSnapshot`: `secretWord` set only when `viewer === drawerId` | Widen: also include when `round.ended` |
| No restart endpoint | `rooms.ts` has create/join/start/strokes/clear/guess/get | Add `POST /:code/restart` |
| No restart store fn | `roomStore.ts` has `startRoom` but no reset | Add `restartRoom` (host + ended gates, clears round) |
| `round.ended` exists | Group 3 `RoundState.ended` set on first correct guess | Drives reveal + restart eligibility |
| Game screen polls but never returns to lobby | `GamePage` polls; only LobbyPage auto-navigates to `/game` | Add game→lobby auto-nav on `status === "lobby"` |
| Result UI absent | `GamePage` shows canvas + guess; no result panel | Render result view when `roundEnded` |
| `status` is `lobby`/`started` only | `RoomStatus` union | No new status needed; restart sets `lobby`, `round=null` |

## 3. State Model

### 3.1 Backend model changes (`backend/src/models/game.ts`)

**None required.** `RoomStatus` stays `"lobby" | "started"`; `Room.round` already nullable;
`RoundState.ended` already exists; snapshot already carries `secretWord?`, `roundEnded`, `strokes`,
`guesses`, per-participant `score`. Group 4 changes behavior, not shape.

### 3.2 Backend store changes (`backend/src/services/roomStore.ts`)

- **`toRoomSnapshot`** (modify reveal rule): include `secretWord` when
  `viewerParticipantId === round.drawerId` **OR** `round.ended === true`. (FR-049)
- **New `restartRoom(code, participantId)`** → discriminated result:
  - `not-found` (404) — unknown room
  - `forbidden` (403) — not the host (FR-055)
  - `not-ended` (409) — `round` exists and `round.ended === false` (FR-056)
  - `ok` — set `status = "lobby"`, `round = null`, preserve participants/host; idempotent when already
    `lobby` with `round === null` (FR-053, FR-054, FR-057)

```typescript
export type RestartRoomResult =
  | { ok: true; room: Room }
  | { ok: false; reason: "not-found" | "forbidden" | "not-ended" };
```

### 3.3 Backend validation (`backend/src/api/schemas.ts`)

```typescript
export const restartRoomSchema = z.object({
  participantId: z.string().min(1, "participantId is required")
});
```

(Identical in shape to `startRoomSchema`; separate export for clarity/traceability.)

### 3.4 Backend route (`backend/src/api/rooms.ts`)

- **New `POST /:code/restart`** → parse params + body, call `restartRoom`, map result:
  - `ok` → `200 { room: toRoomSnapshot(room, participantId) }`
  - `not-found` → 404 "Room not found"
  - `forbidden` → 403 "Only the host can restart the game"
  - `not-ended` → 409 "The round is still in progress"

### 3.5 Frontend changes

- **`frontend/src/services/api.ts`**: add `restartRoom(code, participantId)` (POST → snapshot). Types
  unchanged (snapshot shape already carries the needed fields).
- **`frontend/src/state/roomStore.ts`**: add `restartGame()` action (calls `api.restartRoom`, stores
  snapshot).
- **`frontend/src/pages/GamePage.tsx`**:
  - When `room.roundEnded`, render a **result view** (revealed `secretWord`, final scores via
    `Scoreboard`, full history via `ResultPanel`) and keep canvas/guess disabled.
  - Host sees a **Restart** button (calls `restartGame`); non-hosts do not.
  - Add auto-navigation: when `room.status === "lobby"`, `navigate("/lobby")` (mirrors LobbyPage's
    game navigation). Existing ~2s polling already refreshes status.
- **`frontend/src/components/ResultPanel.tsx`** / **`Scoreboard.tsx`**: already render history/scores
  from the snapshot (Group 3); reused as-is. Word reveal is shown in `GamePage` result view.

## 4. Data Flow

### 4.1 Result reveal

Round ends (Group 3 sets `round.ended = true`) → next `GET /rooms/:code` poll for every viewer returns
`secretWord` (projection now reveals when ended) + `roundEnded: true` → `GamePage` renders the result
view for all players within ~2s. (FR-049, FR-050, SC-001)

### 4.2 Restart

Host clicks Restart → `roomStore.restartGame()` → `POST /rooms/:code/restart { participantId }` →
`restartRoom` validates host + ended, sets `status = "lobby"`, `round = null` → returns snapshot. The
host's own tab updates immediately; other tabs pick up `status === "lobby"` on their next poll.
(FR-052, FR-053, FR-054)

### 4.3 Game→lobby auto-navigation

Each game-screen tab polling `GET /rooms/:code` observes `status === "lobby"` → auto-navigates to
`/lobby` with participants preserved. (FR-060, SC-003) The host can then start a fresh round (Groups 1–2),
which re-initializes `round`. (FR-058, SC-004)

### 4.4 Guard rejections

Non-host restart → 403, no mutation (FR-055, SC-002). Restart while active (`round.ended === false`) →
409, no mutation (FR-056). Restart already in lobby → idempotent `ok` (FR-057).

## 5. File-Level Plan

### Backend

| File | Change |
|------|--------|
| `backend/src/models/game.ts` | No shape change (behavior only) |
| `backend/src/services/roomStore.ts` | Reveal rule in `toRoomSnapshot` (drawer **or** ended); add `restartRoom` + `RestartRoomResult` |
| `backend/src/api/schemas.ts` | Add `restartRoomSchema` |
| `backend/src/api/rooms.ts` | Add `POST /:code/restart`; map results to 200/400/403/404/409 |
| `backend/src/services/roomStore.test.ts` | Reveal-when-ended; restart host/ended/idempotent/isolation; new-start-after-restart resets round |
| `backend/src/api/schemas.test.ts` | `restartRoomSchema` validation |

### Frontend

| File | Change |
|------|--------|
| `frontend/src/services/api.ts` | Add `restartRoom` |
| `frontend/src/state/roomStore.ts` | Add `restartGame` action |
| `frontend/src/pages/GamePage.tsx` | Result view when `roundEnded`; host Restart button; auto-nav to `/lobby` when `status === "lobby"` |
| `frontend/src/services/api.test.ts` | `restartRoom` URL/body |

## 6. API Contract (Group 4)

See [contracts/rooms-api.md](./contracts/rooms-api.md). New/changed:

- `POST /rooms/:code/restart` — `{ participantId }`; host-only; only when `round.ended`; → snapshot.
- `GET /rooms/:code` — snapshot now includes `secretWord` for **all** viewers when `roundEnded` is true.

Unchanged route paths from Groups 1–3; existing `HttpError` + `errorHandler` for messages.

## 7. Implementation Sequence

1. **Reveal rule** — update `toRoomSnapshot` to include `secretWord` when drawer **or** `round.ended`.
2. **Restart store** — `restartRoom` with host/ended/idempotent gates + `RestartRoomResult`.
3. **Schema + route** — `restartRoomSchema`; `POST /:code/restart` with status mapping.
4. **Backend tests** — reveal-when-ended, restart gates, idempotency, isolation, fresh round after restart.
5. **Frontend api + state** — `restartRoom` + `restartGame`.
6. **Result UI** — `GamePage` result view (revealed word, scores, history), host Restart button.
7. **Auto-nav** — `GamePage` navigates to `/lobby` when `status === "lobby"`.
8. **Validate** — two/three-tab quickstart; `npm test` + builds.

## 8. Testing Strategy

### Automated

- **`roomStore.test.ts`**: snapshot reveals `secretWord` to a guesser once `round.ended` (and still hides
  while active); `restartRoom` rejects non-host (`forbidden`) and active round (`not-ended`), succeeds for
  host on ended round (status `lobby`, `round` null, participants preserved), is idempotent when already
  lobby; restart in room A leaves room B unchanged; a fresh `startRoom` after restart yields scores all 0
  and empty strokes/guesses.
- **`schemas.test.ts`**: `restartRoomSchema` requires non-empty `participantId`.
- **`api.test.ts`**: `restartRoom` posts correct path/body.

### Manual (two/three browser tabs)

1. Play to a correct guess → all tabs show revealed word + final scores + history within ~2s.
2. Controls locked for everyone after end.
3. Non-host has no Restart control; host does.
4. Host restarts → all tabs land on `/lobby` with same participants within ~2s.
5. Host starts again → fresh round, scores 0, empty canvas, word drawer-only again.
6. Second room in parallel → no result/restart leakage.

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Word leaks before round ends | Reveal strictly gated on `round.ended` in the server projection; unit-tested both ways |
| Stranded players on game screen after restart | Poll-driven auto-nav to `/lobby` on `status === "lobby"` (FR-060) |
| Double restart race | Idempotent when already lobby/`round === null` (FR-057) |
| Restart during active round | `not-ended` → 409, no mutation (FR-056) |
| Stale round data after restart | `round = null` clears strokes/guesses/scores/word; snapshot omits them |
| Cross-room contamination | Keyed `Map`; isolation unit test (FR-061, SC-005) |
| Scope creep into multi-round | Restart returns to existing lobby; new round uses unchanged Group 1–2 start |

## 10. Out of Scope

Per constitution §V and FR-062: multiple rounds per session, drawer rotation, timers/countdowns,
score persistence, leaderboards across games, WebSockets, databases, auth, new libraries, unrelated
refactors. A separate `"ended"` room status is intentionally avoided (reveal is driven by `round.ended`).

## Implementation Notes & Deviations (post-execution)

- **Reveal rule (T003)**: `toRoomSnapshot` now sets `secretWord` when the viewer is the drawer **or** `round.ended === true`, keeping drawer-only visibility during active play. No model shape change.
- **Restart guard order (T007)**: `restartRoom` checks `not-found` → `forbidden` (host only) → idempotent short-circuit when already `lobby`/`round === null` → `not-ended`. On success it sets `status = "lobby"`, `round = null`, preserves participants/`hostId`, and bumps `updatedAt`.
- **HTTP mapping (T009)**: `POST /:code/restart` maps `not-found` → 404, `forbidden` → 403, `not-ended` → 409, Zod failures → 400, success → 200 with viewer-scoped snapshot. Mirrors the existing `start` endpoint shape.
- **Frontend result view (T004)**: When `room.roundEnded`, the canvas card shows a green "The word was: …" banner to all players; `Scoreboard`/`ResultPanel` are reused unchanged for final scores/history. Canvas and guess form stay disabled via existing `canDraw`/`canGuess` gates.
- **Restart UX (T012)**: Host sees a "Restart Game" button only when `roundEnded`; non-hosts see a "Waiting for the host to restart…" hint.
- **Auto-nav (T013)**: A dedicated effect navigates to `/lobby` (replace) whenever `room.status === "lobby"`, so all polling game tabs return to the lobby after restart.
- **Validation**: 50 backend tests + 5 frontend tests pass; backend and frontend builds clean; no lint errors. T015 (multi-tab quickstart) left for manual verification.

## Project Structure (documentation)

```text
specs/004-result-restart/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/rooms-api.md  # Phase 1 output
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks (next)
```
