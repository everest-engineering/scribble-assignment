# Implementation Plan: Result, Restart & Final Validation (Scenario 4)

**Branch**: `scribble-lab` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)

**Input**: Scenario 4 — Result, Restart & Final Validation. Frontend: React + Vite + TypeScript. Backend: Node.js + Express + TypeScript + Zod.

**Scope boundary**: Implement FR-001–FR-015 only. Extends Scenario 3 with round-end transition, result view (word reveal to all, final scores, guess history), host-only restart to lobby with round state cleared, and polling-driven navigation. No drawer rotation, multi-round auto-progression, or timers.

**Prerequisite**: Scenarios 1–3 complete — lobby/start, drawer/word visibility, drawing, guesses, scoring (`specs/001-room-setup-lobby/`, `specs/002-game-start-drawer-flow/`, `specs/003-gameplay-interaction/`).

## Summary

Close the game loop by (1) transitioning the room to a `results` status when the first case-insensitive correct guess is submitted, (2) freezing gameplay mutations while in results, (3) exposing the secret word to all participants along with final scores and full guess history via the existing snapshot + ~2s polling, (4) adding a host-only restart action that returns the room to `lobby` with participants preserved and all round fields cleared, and (5) navigating all clients automatically between `/game`, `/result`, and `/lobby` based on polled room status.

## Technical Context

**Language/Version**: TypeScript (ES modules) — Node.js backend, React 18 frontend  
**Primary Dependencies**: Express, Zod, React Router v6, Vite (no new packages)  
**Storage**: In-memory `Map<string, Room>` — round data cleared on restart  
**Testing**: Vitest for round-end transition and restart reset; manual two-tab validation for result sync and restart navigation  
**Target Platform**: Local dev — backend `:3001`, frontend `:5173`  
**Performance Goals**: Result/restart detection within one ~2s poll cycle  
**Constraints**: HTTP polling only; server-authoritative status transitions; Zod on new mutating route  
**Scale/Scope**: Single round cycle; ~12 files touched

## Constitution Check

| Principle | Requirement | Plan compliance |
|-----------|-------------|-----------------|
| II — Architecture | No WebSockets, DB, auth | ✅ REST + existing polling hooks only |
| III — Deterministic rules | Server-authoritative transitions; Zod validation | ✅ Correct guess → `results` on server; restart host-only |
| V — Minimal diffs | Brownfield extension of Scenario 3 | ✅ Targeted edits listed below |
| VI — Validation | Two-tab manual + build both apps | ✅ Testing Strategy below |
| VII — Testing | Vitest for state transitions | ✅ Unit tests planned |

**Post-design re-check**: No violations.

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart-validation/
├── spec.md
├── plan.md              # This file
└── tasks.md             # (/speckit-tasks — not yet created)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/game.ts                 # + "results" RoomStatus
│   ├── services/roomStore.ts          # round-end in submitGuess; restartGame; snapshot for results
│   ├── services/roomStore.test.ts
│   ├── api/schemas.ts                 # restartGameSchema
│   └── api/rooms.ts                   # POST /:code/restart
frontend/
├── src/
│   ├── services/api.ts                # "results" status + restartRoom()
│   ├── state/roomStore.ts             # restartRoom action
│   ├── hooks/useGamePolling.ts        # navigate to /result on results status
│   ├── hooks/useResultPolling.ts      # NEW — poll results; navigate to /lobby on restart
│   ├── pages/ResultPage.tsx           # NEW — word, scores, history, host restart
│   ├── pages/GamePage.tsx             # redirect when status !== playing
│   ├── routes/index.tsx               # + /result route
│   └── styles/app.css                 # result page styles
```

**Reused unchanged (display only)**: `Scoreboard.tsx`, `ResultPanel.tsx`, `RoomCodeBadge.tsx`, `Card.tsx`.

## Starter Gaps (Discovery)

| Area | Current behavior | Required for Scenario 4 |
|------|------------------|-------------------------|
| Room status | `"lobby" \| "playing"` only | Add `"results"` lifecycle phase (FR-001, FR-009) |
| Correct guess | Scores + history; stays `playing` | Transition to `results` on first correct match (FR-001) |
| Word visibility | Drawer-only during `playing` | Revealed to all during `results` (FR-004) |
| Gameplay guards | Reject when not `playing` | Strokes/guesses already rejected once status is `results` (FR-002–FR-003) |
| Join | Rejected when not `lobby` | Already covers `results` — no code change needed (FR-012) |
| Restart | None | Host-only `POST /restart`; clear round fields; `lobby` (FR-008–FR-011) |
| Result route | None — `/game` only | New `/result` page (FR-013) |
| Navigation | Lobby → game on start | Game → result on end; result → lobby on restart (FR-013–FR-014) |
| `useGamePolling` | Polls only while `playing` | Detect `results` and navigate (FR-006–FR-007, FR-013) |

## Data Model

### Backend types (`backend/src/models/game.ts`)

**RoomStatus** (extend):

```text
"lobby" | "playing" | "results"
```

**Room lifecycle**:

```text
lobby
  → startGame → playing
playing
  → submitGuess (correct) → results
results
  → restartGame (host) → lobby
```

No new entity types. Existing `scores`, `strokes`, `guesses`, `drawerId`, `secretWord` are retained frozen in `results` and cleared on restart.

### State transitions (server-authoritative)

```text
submitGuess (extend Scenario 3):
  playing + guesser POST guess
    → evaluateGuess → update scores → append guess
    → if isCorrect: room.status = "results"
    → else: status remains "playing"

addStroke / clearCanvas (unchanged guards):
  → getPlayingRoom rejects when status !== "playing" (includes "results")

restartGame (new):
  results + host POST restart
    → status = "lobby"
    → delete drawerId, secretWord, scores, strokes, guesses
    → participants unchanged
    → updatedAt = now()
```

### Snapshot rules (`toRoomSnapshot` extend)

When `room.status === "results"`:

| Field | Value |
|-------|-------|
| `status` | `"results"` |
| `secretWord` | `room.secretWord` for **all** viewers (FR-004) |
| `participants[].score` | Final scores from `room.scores` (FR-005) |
| `guesses` | Full ordered history (FR-006) |
| `strokes` | Optional — include for final drawing display; not required by spec but harmless |
| `drawerId` | Retained for context (who drew); roles undefined when not `playing` |
| `canStart` | `false` (lobby-only) |
| `viewerRole` | `null` (no active role in results) |

When `room.status === "lobby"` after restart:

| Field | Value |
|-------|-------|
| Round fields | Absent / undefined — no secretWord, scores, strokes, guesses, drawerId |
| `canStart` | Host + ≥2 players → `true` |

## API Behavior

### Modified behavior

| Route | Scenario 4 change |
|-------|-------------------|
| `POST /rooms/:code/guesses` | On correct guess, transition room to `results`; return snapshot with revealed word |
| `GET /rooms/:code?participantId=` | Snapshot includes results-phase fields per table above |

Existing stroke/clear/guess routes already return `"Game is not active"` when status is not `playing` — satisfies FR-002–FR-003 without new error codes.

### New route

| Route | Body | Auth rule | Effect |
|-------|------|-----------|--------|
| `POST /rooms/:code/restart` | `{ participantId }` | Must be host; room `results` | Reset to lobby; clear round state |

**Zod schema** (`restartGameSchema`): `{ participantId: string (uuid) }`

**Error mapping**:

| Condition | HTTP | Message |
|-----------|------|---------|
| Room not found | 404 | `"Unable to load room"` |
| Not host | 403 | `"Only the host can restart the game"` |
| Not in results | 400 | `"Round has not ended"` |

Response: `{ participantId, room: toRoomSnapshot(...) }` (same pattern as start/join).

## Data Flow

### Flow 1 — Round ends on correct guess (P1)

```text
Guesser GuessForm → POST /guesses
  → server: evaluateGuess → scores += points → guesses.push
  → if isCorrect: status = "results"
  → snapshot: secretWord visible to all, final scores, history

Client (immediate):
  → roomStore.setRoomSession(response)
  → GamePage or submit handler detects status === "results" → navigate("/result")

Client (poll backup):
  → useGamePolling detects results on next interval → navigate("/result")
```

### Flow 2 — Result display (P2, P3)

```text
ResultPage mounts + useResultPolling
  → fetchRoomSilent every ~2s while status === "results"
  → render secret word (all players)
  → Scoreboard(final scores)
  → ResultPanel(full guess history)
  → DrawingCanvas read-only with final strokes (optional polish)
```

### Flow 3 — Host restart (P4)

```text
Host clicks "Restart" on ResultPage
  → POST /restart { participantId }
  → server: lobby + clear round fields
  → roomStore.setRoomSession(response)
  → navigate("/lobby")

Non-host:
  → no restart button (UI)
  → POST /restart → 403 if attempted directly

All clients:
  → useResultPolling detects status === "lobby" → navigate("/lobby")
```

### Flow 4 — Navigation sync (P5)

```text
/game + poll/status === "results"  → /result
/result + poll/status === "lobby"  → /lobby
/result + poll/status === "playing" → /game (edge: should not occur)
/lobby + poll/status === "playing"  → /game (existing Scenario 1)
/lobby + poll/status === "results"  → /result (edge: missed transition)
```

Update `useLobbyPolling` initial check: navigate to `/result` when status is `results`, not only `/game` when `playing`.

## Implementation Sequence

Ordered by user story priority.

### Slice 1 — P1: Round-end transition (FR-001–FR-003)

**Backend**

1. `game.ts`: Add `"results"` to `RoomStatus`.
2. `roomStore.ts`: In `submitGuess`, after recording guess, if `isCorrect` set `room.status = "results"`.
3. `roomStore.test.ts`:
   - Correct guess → status `results`.
   - Second guess after results → rejected (`not_playing`).
   - Stroke/clear after results → rejected.

**Verify**: Vitest passes; manual — correct guess returns snapshot with `status: "results"`.

### Slice 2 — P2: Results snapshot — word to all (FR-004–FR-006)

**Backend**

4. `roomStore.ts`: Extend `toRoomSnapshot` with `isResults` branch — expose `secretWord` to all viewers, include scores/guesses.
5. `roomStore.test.ts`: Non-drawer viewer receives `secretWord` when status is `results`.

**Frontend**

6. `api.ts`: Add `"results"` to `RoomStatus` type.

**Verify**: GET snapshot after round end shows word for guesser participantId.

### Slice 3 — P4: Host restart (FR-008–FR-011)

**Backend**

7. `roomStore.ts`: Add `restartGame(code, participantId)` with host + results guards; clear round fields; set `lobby`.
8. `schemas.ts`: `restartGameSchema`.
9. `rooms.ts`: `POST /:code/restart` with error mapping.
10. `roomStore.test.ts`:
    - Host restart → lobby, participants preserved, round fields cleared.
    - Non-host → `not_host`.
    - Restart from `playing` → `not_results`.

**Frontend**

11. `api.ts`: `restartRoom(code, participantId)`.
12. `roomStore.ts`: `restartRoom()` action.

**Verify**: Vitest; curl/Postman restart returns lobby snapshot with no round data.

### Slice 4 — P2/P3/P5: Result page + polling + navigation (FR-007, FR-013–FR-015)

**Frontend**

13. `pages/ResultPage.tsx`:
    - Secret word prominently displayed (all players).
    - `Scoreboard`, `ResultPanel`, participant list.
    - Host-only "Restart" button calling `roomStore.restartRoom()`.
    - Poll error display (non-crashing).
14. `hooks/useResultPolling.ts`: Poll while `status === "results"`; navigate to `/lobby` on lobby; surface errors.
15. `hooks/useGamePolling.ts`: After poll, if snapshot status is `results`, `navigate("/result")`.
16. `pages/GamePage.tsx`: On mount/render, if `room.status === "results"`, redirect to `/result`; disable guess form implicitly by leaving page.
17. `hooks/useLobbyPolling.ts`: Extend status redirect — `playing` → `/game`, `results` → `/result`.
18. `routes/index.tsx`: Add `<Route path="/result" element={<ResultPage />} />`.
19. `styles/app.css`: Result page layout (word reveal, restart button row).

**Optional polish**: Read-only `DrawingCanvas` with final strokes on result page.

**Verify**: Two-tab — correct guess moves both to `/result` within one poll; word/scores/history match.

### Slice 5 — Final validation (SC-001–SC-007)

20. Run Vitest + builds.
21. Manual two-tab checklist (Testing Strategy).
22. Confirm host can start fresh round after restart (Scenario 1 start flow).

## File Change Reference

| File | Changes |
|------|---------|
| `backend/src/models/game.ts` | `"results"` in `RoomStatus` |
| `backend/src/services/roomStore.ts` | Round-end in `submitGuess`; `restartGame`; `toRoomSnapshot` results branch |
| `backend/src/services/roomStore.test.ts` | Round-end, freeze, restart tests |
| `backend/src/api/schemas.ts` | `restartGameSchema` |
| `backend/src/api/rooms.ts` | `POST /:code/restart` |
| `frontend/src/services/api.ts` | `RoomStatus`; `restartRoom()` |
| `frontend/src/state/roomStore.ts` | `restartRoom()` action |
| `frontend/src/hooks/useResultPolling.ts` | **new** |
| `frontend/src/hooks/useGamePolling.ts` | Navigate to `/result` |
| `frontend/src/hooks/useLobbyPolling.ts` | Navigate to `/result` when applicable |
| `frontend/src/pages/ResultPage.tsx` | **new** |
| `frontend/src/pages/GamePage.tsx` | Redirect when not `playing` |
| `frontend/src/routes/index.tsx` | `/result` route |
| `frontend/src/styles/app.css` | Result page styles |
| `frontend/src/services/api.test.ts` | Mock restart + results status if present |

## Testing Strategy

| Layer | What | Maps to |
|-------|------|---------|
| Vitest | Correct guess → `results`; mutations blocked in results; restart clears state; host-only restart | FR-001–FR-003, FR-008–FR-011, SC-001, SC-003, SC-005 |
| Manual two-tab | Flows below | P1–P5, SC-002, SC-004, SC-006–SC-007 |
| Build | `npm run build` both apps | Constitution VI |

**Manual validation** (two tabs — host Tab A, guesser Tab B):

1. **P1**: Play round; B submits correct guess → both reach `/result` within ~2s; further guesses/drawing rejected.
2. **P2**: On result screen, both see same secret word, final scores, full guess history.
3. **P3**: Wait one poll cycle — data unchanged and matching across tabs.
4. **P4**: A clicks Restart → both return to `/lobby`; same two players; no stale scores/word/history; A can Start Game again.
5. **P5**: B has no restart button; fresh round after restart works per Scenarios 2–3.
6. **Edge**: Attempt join during results from new tab → rejected.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Client stuck on `/game` after round end | Dual path: immediate navigate on guess response + poll fallback in `useGamePolling` |
| Word leaked before results | `toRoomSnapshot` keeps word hidden during `playing` for non-drawers (unchanged) |
| Partial round clear on restart | Single `restartGame` function deletes all round fields atomically |
| Non-host restart | UI hides button; server returns 403 |
| `useLobbyPolling` sends results room to `/game` | Update redirect logic for `results` status |

## Out of Scope Reminders

- Drawer rotation, automatic next round, timers, bonuses
- WebSockets, DB, auth, custom word packs
- Changing scoring rules or guess evaluation
- E2E test framework introduction

**Next step**: Run `/speckit-tasks` to generate ordered `tasks.md` from this plan.
