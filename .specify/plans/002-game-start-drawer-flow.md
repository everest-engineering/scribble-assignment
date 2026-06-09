# Implementation Plan: Game Start & Drawer Flow

**Feature Group**: 002 — Game Start & Drawer Flow
**Date**: 2026-06-09
**Spec**: `.specify/specs/002-game-start-drawer-flow.md`
**Input**: Discovery notes + spec + constitution

---

## Summary

Add drawer assignment, deterministic secret word selection, and conditional word
hiding to the existing game-start flow. The backend assigns the host as drawer,
selects the first starter word as the secret word, and tailors the room snapshot
based on the viewer's identity. The frontend updates the game page to show
drawer identity and (for the drawer only) the secret word. Polling continues
from the lobby into the game view so all participants see the transition.

---

## Constitution Check

| Principle | Relevance | Status |
|---|---|---|
| I. Spec-Driven Development | All work must trace to spec requirements | ✅ Plan maps to FR-001 through FR-007 |
| II. TypeScript Quality & Validation | Input validation, no `any` | ✅ Viewer identity already passed as typed param; no new untrusted inputs |
| III. Incremental Delivery | One feature group at a time | ✅ Only drawer-assignment and word-selection scope |
| IV. Traceability & Documentation | Tasks traceable to spec | ✅ Spec FR/AC references throughout |
| V. Review Discipline | Edge cases, isolation, no out-of-scope | ✅ Non-goals section in spec; multi-room isolation preserved |

No gates violated. No complexity justification needed.

---

## 1. State Model Changes

### Backend — `src/models/game.ts`

| Change | Rationale | Spec Reference |
|---|---|---|
| Add `drawerId: string` to `Room` | Identifies the participant who is drawing this round | FR-001, AC-001 |
| Add `secretWord: string` to `Room` | The word the drawer must illustrate; stored server-side only until filtered for the viewer | FR-002, AC-002 |
| Add `drawerId: string` to `RoomSnapshot` | Exposes drawer identity to all participants via every room-scoped API call | FR-004, AC-005, AC-006 |
| Add `secretWord?: string` to `RoomSnapshot` | Optional field; present only when `viewerParticipantId` matches `drawerId` | FR-003, AC-003, AC-004 |
| Remove `availableWords: string[]` from `RoomSnapshot` | Replaced by conditional `secretWord`; the old field leaked the full list to guessers | FR-003 |
| Remove `roles: ParticipantRole[]` from `RoomSnapshot` | Replaced by `drawerId`; the flat roles array never mapped to individual participants | FR-001 |

**No changes to `Participant`**, `RoomStatus`, or `RoomSessionResponse`.

**No changes to `ParticipantRole` type** — retained for potential future use but
no longer referenced from `RoomSnapshot`.

### Frontend — `src/services/api.ts`

| Change | Rationale | Spec Reference |
|---|---|---|
| Add `drawerId: string` to `RoomSnapshot` | Mirrors backend type | FR-004, AC-005 |
| Add `secretWord?: string` to `RoomSnapshot` | Mirrors backend type; optional because only drawer receives it | FR-003, AC-003 |
| Remove `availableWords: string[]` from `RoomSnapshot` | Mirrors backend type removal | FR-003 |
| Remove `roles: ParticipantRole[]` from `RoomSnapshot` | Mirrors backend type removal | FR-001 |
| Remove `ParticipantRole` type export if no longer used elsewhere | Cleanup | — |

### Frontend — `src/state/roomStore.ts`

| Change | Rationale | Spec Reference |
|---|---|---|
| No new actions or methods needed | `startGame`, `fetchRoom`, `startPolling`, `stopPolling` already exist from FG1 | AC-007 |

### Frontend — `src/pages/LobbyPage.tsx`

| Change | Rationale | Spec Reference |
|---|---|---|
| Add auto-navigation: when polling returns `status === "playing"`, navigate to `/game` | Non-host participants must reach the game view without clicking anything | FR-001, AC-005, AC-007 |

### Frontend — `src/pages/GamePage.tsx`

| Change | Rationale | Spec Reference |
|---|---|---|
| Start polling on mount via `useEffect` (same pattern as LobbyPage) | Participants must see state changes during the game | AC-007 |
| Stop polling on unmount | Cleanup | AC-007 |
| Show drawer identity: "X is drawing" or "You are drawing" | Implements FR-004 | FR-004, AC-005 |
| Show secret word prominently when the current participant is the drawer | Implements FR-003 for the drawer | FR-003, AC-003 |
| Hide secret word when the current participant is not the drawer | Implements FR-003 for guessers | FR-003, AC-004 |

---

## 2. Backend Changes

### Room Store (`src/services/roomStore.ts`)

- **`startGame` function** — update:
  - Set `room.drawerId = room.hostId` after status transition.
  - Set `room.secretWord = STARTER_WORDS[0]` (deterministic: first word, single round).
  - Room status and timestamps updated as before.
  - Return cloned room in `{ ok: true, room }` (existing return shape unchanged).
  - No change to error paths (404/403/400).

- **`toRoomSnapshot` function** — rework:
  - Accept `viewerParticipantId?: string` (already in signature, currently voided).
  - Include `drawerId` from `room.drawerId` in the snapshot unconditionally.
  - If `viewerParticipantId === room.drawerId`, include `secretWord: room.secretWord`.
  - If `viewerParticipantId !== room.drawerId` or `viewerParticipantId` is undefined, omit `secretWord` from the snapshot.
  - Remove `availableWords` and `roles` from the returned object.
  - Preserve existing `code`, `status`, `participants`, `hostId` fields.

- **`listWords` function** — unchanged. Still returns the full word list. Consumed only by `toRoomSnapshot` (which now uses it for selection instead of pass-through) and possibly tests.

### Routes (`src/api/rooms.ts`)

- **`POST /:code/start` route** — fix viewer identity:
  - Current code passes `result.room.participants[0].id` as `viewerParticipantId`.
  - Change to pass the actual requester's `participantId` from the parsed body.
  - This ensures the start-game response is correctly tailored (drawer sees secret word immediately).

- **No other route changes needed.** The `GET /:code`, `POST /`, and `POST /:code/join` routes already call `toRoomSnapshot` with a `participantId` — those will automatically benefit from the reworked snapshot logic.

### Schemas (`src/api/schemas.ts`)

- No changes needed. `startGameBodySchema` already validates `participantId: string`. No new input fields are introduced.

### Seed Data (`src/seed/starterData.ts`)

- No changes needed. The word list and roles array remain as-is. `STARTER_WORDS[0]` is consumed by `startGame` for word selection.

---

## 3. Frontend Changes

### API Service (`src/services/api.ts`)

- Update `RoomSnapshot` interface:
  ```typescript
  // Before
  interface RoomSnapshot {
    code: string;
    status: "lobby" | "playing";
    participants: Participant[];
    hostId: string;
    availableWords: string[];
    roles: ParticipantRole[];
  }

  // After
  interface RoomSnapshot {
    code: string;
    status: "lobby" | "playing";
    participants: Participant[];
    hostId: string;
    drawerId: string;
    secretWord?: string;
  }
  ```
- Remove `ParticipantRole` type if no other code depends on it.

### Room Store (`src/state/roomStore.ts`)

- No new actions or methods required. The existing `startGame`, `fetchRoom`, `startPolling`, and `stopPolling` fully support the playing state.

### Lobby Page (`src/pages/LobbyPage.tsx`)

- Add a `useEffect` (or extend the existing polling effect) that watches `room.status`:
  - When `room.status === "playing"` and the current participant did NOT trigger the start (i.e., this is a polling-driven transition), navigate to `/game`.
  - This handles the case where a non-host participant's polling detects the game has started.
  - Guard against re-triggering: check that navigation hasn't already happened (e.g., track a ref or use a conditional on the existing room state).
  - The host already navigates via the `startGame` return; this effect provides a fallback for the host too (harmless, navigation will be a no-op if already on `/game`).

### Game Page (`src/pages/GamePage.tsx`)

- Add polling lifecycle (identical pattern to LobbyPage):
  - `useEffect` on mount: call `roomStore.startPolling(2000)`.
  - Cleanup on unmount: call `roomStore.stopPolling()`.

- Add drawer identification display:
  - Read `room.drawerId` from the state.
  - Compare to `participantId` (own ID).
  - If drawer: show "You are the drawer!" with the secret word in a prominent card.
  - If not drawer: show "[Drawer name] is drawing" above the canvas area.

- Update the existing "Round 1" and "Guess the Word!" header to reflect actual state:
  - Keep "Round 1" as a static label (single round).
  - Replace "Guess the Word!" with context-aware text (drawer sees "Draw this word", guessers see "Guess the word!").

- Preserve all existing layout structure (3-column, sidebar components, exit button). Canvas, GuessForm, Scoreboard, and ResultPanel remain as stubs for FG3/FG4.

### Create Room Page / Join Room Page

- No changes needed. Name validation from FG1 is sufficient.

---

## 4. API Changes

### Modified Endpoints (Behavior Change, No New Routes)

| Method | Path | Change |
|---|---|---|
| POST | `/rooms/:code/start` | Response now includes `drawerId` and, for the requester only, `secretWord`. Fix `viewerParticipantId` argument to use requester's ID instead of `participants[0].id`. |
| GET | `/rooms/:code` | Response now includes `drawerId` and, conditionally, `secretWord` based on `participantId` query param. No longer returns `availableWords` or `roles`. |
| POST | `/rooms` | Response now includes `drawerId` (empty string in lobby state, as no drawer is assigned yet) and no longer includes `availableWords` or `roles`. |
| POST | `/rooms/:code/join` | Same response shape change as create. |

### Response Shape Change

Current `RoomSnapshot`:
```typescript
{ code, status, participants, hostId, availableWords, roles }
```

New `RoomSnapshot`:
```typescript
{ code, status, participants, hostId, drawerId, secretWord? }
```

The `secretWord` field is present only in the `"playing"` state AND when the
viewer is the drawer.

---

## 5. Data Flow

### Game Start (Host Clicks "Start Game")

```
[Host clicks "Start Game" on LobbyPage]
  ↓
[LobbyPage] calls roomStore.startGame()
  ↓
[RoomStore.startGame]
  ↓ POST /rooms/:code/start { participantId }
[Backend] validate: is host? has 2+ players?
  ↓ on success:
    room.drawerId = room.hostId
    room.secretWord = STARTER_WORDS[0]
    room.status = "playing"
    room.updatedAt = now()
  ↓ return toRoomSnapshot(room, participantId)
    → includes drawerId + secretWord (requester is the host/drawer)
[RoomStore] setRoomSnapshot(snapshot), stopPolling()
  ↓ on success response
[LobbyPage] navigate("/game")
```

### Game Start (Non-Host, Detected via Polling)

```
[Non-host participant on LobbyPage]
  ↓ polling interval fires (every 2s)
[RoomStore.fetchRoom]
  ↓ GET /rooms/:code?participantId=xxx
[Backend] toRoomSnapshot(room, participantId)
  → includes drawerId, omits secretWord (viewer is not the drawer)
[RoomStore] setRoomSnapshot(snapshot)
  ↓ re-render via useSyncExternalStore
[LobbyPage] useEffect detects room.status === "playing"
  ↓ navigate("/game")
```

### Game Page Initial Render (Drawer)

```
[GamePage] mount
  ↓ startPolling(2000)
  ↓ read room.drawerId === participantId → true
  ↓ display: "You are the drawer!" + secretWord
  ↓ canvas area shows word hint (placeholder)
```

### Game Page Initial Render (Guesser)

```
[GamePage] mount
  ↓ startPolling(2000)
  ↓ read room.drawerId !== participantId → false
  ↓ find drawer participant by ID
  ↓ display: "[Drawer name] is drawing"
  ↓ secretWord not rendered (field absent from snapshot)
```

---

## 6. File-Level Impact Analysis

### Files to Modify

| File | Change Type | Summary |
|---|---|---|
| `backend/src/models/game.ts` | **Extend** | Add `drawerId` and `secretWord` to `Room`; add `drawerId` and `secretWord?` to `RoomSnapshot`; remove `availableWords` and `roles` from `RoomSnapshot` |
| `backend/src/services/roomStore.ts` | **Rework** | Update `startGame` to set `drawerId` and `secretWord`; rework `toRoomSnapshot` to use `viewerParticipantId` for conditional word hiding and to remove `availableWords`/`roles` |
| `backend/src/api/rooms.ts` | **Fix** | Fix `POST /:code/start` to pass actual requester's `participantId` as viewer to `toRoomSnapshot` |
| `frontend/src/services/api.ts` | **Extend** | Update `RoomSnapshot` type: add `drawerId`, add `secretWord?`, remove `availableWords` and `roles`; remove `ParticipantRole` if unused |
| `frontend/src/pages/LobbyPage.tsx` | **Minor** | Add auto-navigation to `/game` when polling detects `status === "playing"` |
| `frontend/src/pages/GamePage.tsx` | **Rework** | Add polling lifecycle; show drawer identity and conditional secret word |

### Files to Add

| File | Change Type | Summary |
|---|---|---|
| `backend/src/services/roomStore.test.ts` | **Extend** | Tests for drawer assignment, word selection, viewer-identity-based word hiding |
| `backend/src/api/schemas.test.ts` | **Extend** | (if needed) No new schemas — likely no changes |
| `frontend/src/state/roomStore.test.ts` | **Extend** | Tests for GamePage-related store behavior (optional — covered by existing store tests) |

### Files Unchanged

| File | Rationale |
|---|---|
| `backend/src/api/router.ts` | No routing changes |
| `backend/src/app.ts` | No app-level configuration changes |
| `backend/src/server.ts` | No server configuration changes |
| `backend/src/seed/starterData.ts` | Word list and roles unchanged; consumed by `startGame` |
| `backend/src/api/schemas.ts` | No new schemas or validation rules |
| `frontend/src/state/roomStore.ts` | No new methods; existing actions suffice |
| `frontend/src/pages/CreateRoomPage.tsx` | No changes needed |
| `frontend/src/pages/JoinRoomPage.tsx` | No changes needed |
| `frontend/src/pages/StartPage.tsx` | No changes needed |
| `frontend/src/components/GuessForm.tsx` | Still a stub; deferred to FG3 |
| `frontend/src/components/Scoreboard.tsx` | Still a stub; deferred to FG4 |
| `frontend/src/components/ResultPanel.tsx` | Still a stub; deferred to FG4 |
| `frontend/src/styles/app.css` | Existing styles sufficient; minor additions possible |

---

## 7. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Stale viewer identity in polling**: A participant's `participantId` is not sent (query param missing or undefined), causing `toRoomSnapshot` to omit `secretWord` for the drawer | Low | Drawer doesn't see the word on poll response | Frontend always sends `participantId` in the query (existing behavior from FG1). Default `viewerParticipantId` to undefined → omit `secretWord` (safe default). |
| **Race: host starts game while guesser polls simultaneously** | Low | Guesser might briefly see stale lobby state | Harmless — next poll tick (within 2s) will show playing state. The LobbyPage's `useEffect` watching `room.status` will trigger navigation on the next re-render. |
| **Bug in start route viewer identity** | High (confirmed) | Start response returns incorrect snapshot (wrong secret word visibility) | Fix: change `result.room.participants[0].id` to `participantId` from request body. Covered by test. |
| **Frontend code references `availableWords` or `roles`** | Medium | TypeScript compilation error after removal | Audit all frontend files for references to these fields. TypeScript `--noEmit` will catch any missed references. |
| **Backend code references `availableWords` or `roles` in tests** | Medium | Test compilation/runtime failures | Audit and update test assertions to use `drawerId` and `secretWord` instead. |
| **`listWords` function becomes dead code** | Low | Unused export | Either remove or retain for test assertions. Decision can be made during implementation. |

---

## 8. Validation Strategy

### Automated Tests

| Area | What to Test | Tool |
|---|---|---|
| Room store — `startGame` | drawerId equals hostId after start | Vitest (backend) |
| Room store — `startGame` | secretWord is set to STARTER_WORDS[0] after start | Vitest (backend) |
| Room store — `toRoomSnapshot` | drawerId present in all snapshots during playing state | Vitest (backend) |
| Room store — `toRoomSnapshot` | secretWord present when viewerParticipantId matches drawerId | Vitest (backend) |
| Room store — `toRoomSnapshot` | secretWord absent when viewerParticipantId does not match drawerId | Vitest (backend) |
| Room store — `toRoomSnapshot` | secretWord absent when viewerParticipantId is undefined | Vitest (backend) |
| Room store — `toRoomSnapshot` | availableWords and roles are not present in snapshot | Vitest (backend) |
| Room store — `startGame` | FG1 tests continue to pass (host-only, 2-player minimum, 404) | Vitest (backend) |
| Frontend — types | RoomSnapshot type matches new shape (compiler check) | TSC (frontend) |
| Frontend — store | Existing store tests pass with updated types | Vitest (frontend) |

### Manual Validation (Two Browser Tabs)

| Scenario | Steps | Expected |
|---|---|---|
| Host starts game | Tab A (host) clicks Start Game with 2+ players. | Both tabs navigate to `/game` within ~3s. Host tab shows "You are the drawer!" and secret word. |
| Drawer identity visible | Tab A (host) and Tab B (guesser) are both on game page. | Both tabs show the same participant name as the drawer. |
| Secret word hidden from guesser | Tab B is on game page as a guesser. | Tab B does not display the secret word. Tab A displays it. |
| Polling continues in game view | After navigating to `/game`, wait 5+ seconds. | Room state is fetched periodically; no console errors. |
| Room isolation | Two separate rooms both in playing state. | Room A's participants cannot see Room B's drawer or secret word. |
| Drawer-id consistency | Compare `drawerId` across both tabs. | Both tabs report the same `drawerId` value. |

### Validation Gate

All acceptance criteria AC-001 through AC-007 must pass before Feature Group 2
is considered complete. Progression to Feature Group 3 (Gameplay Interaction)
is not permitted until this gate passes.
