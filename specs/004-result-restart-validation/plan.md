# Implementation Plan: Result, Restart & Final Validation

**Branch**: `004-result-restart-validation` | **Date**: 2026-06-26 | **Spec**: specs/004-result-restart-validation/spec.md

**Input**: Feature specification from `specs/004-result-restart-validation/spec.md`

## Summary

After a round ends, persist the round result (secret word, scores, guess history) until the host restarts the game back to lobby. Add host disconnect detection with claim-host, drawer disconnect detection with skip-round and notify-host, and enforce max name length. Clicking "Notify Host" locally dismisses the drawer-disconnected popup. When all other players leave during a game, the remaining player sees a game-over result screen with only the Exit Game button. Changes span both backend (new endpoints, model changes, disconnect detection logic) and frontend (enhanced overlay, popups, buttons).

## Technical Context

**Language/Version**: TypeScript (ES2022, NodeNext module resolution, strict mode)

**Primary Dependencies**: Express 4 + Zod (backend); React 18 + React Router 6 + Vite (frontend)

**Storage**: In-memory only (Map-based room store on backend)

**Testing**: Vitest, minimum 80% line coverage

**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge)

**Performance Goals**: Disconnect detection within 30s + 1 polling cycle (~32s total). Restart/skip/claim-host actions reflected in all clients within 1 polling cycle (~2s).

**Polling Model**: GamePage and LobbyPage poll `GET /rooms/:code?participantId=` every 2s. Each poll updates the requesting participant's `lastSeenAt`. Disconnect detection is computed server-side on each poll by comparing `lastSeenAt` against current time.

**Constraints**: No WebSockets, no databases, no auth, polling-only sync. Backend centralized error handling. Zod for request validation. Functional components with hooks on frontend.

**Scale/Scope**: Lab project — small scale, no production deployment.

## Clarification Decisions

- **Persistent result**: `lastRoundResult` no longer auto-expires (remove `clearExpiredRoundResult()`). Result overlay stays until player clicks "Continue" (local dismiss) or host restarts.
- **Continue behavior**: Local-only dismiss. Client suppresses re-display even though server still has `lastRoundResult`. On restart, server clears `lastRoundResult` and client overlay disappears naturally.
- **Disconnect detection**: 30-second threshold based on `lastSeenAt` updated on each `GET /:code`. Computed in `toRoomSnapshot()`, not a background timer.
- **Skip-round race safety**: Reject skip-round with 400 if correct guess exists in current round's guess history.
- **Skip Round button**: Always visible to host (not conditional on drawer disconnect).
- **Drawer-disconnected popup**: Full popup for non-host players with "Notify Host" button. Sets `skipSuggested` on the room. Host sees badge on Skip Round button.
- **Name resolution**: Scores table resolves names from `participants[]`, not `guessHistory`.
- **Max name length**: 20 characters, validated by Zod (backend) + `maxLength` attribute (frontend).
- **Notify Host dismisses banner**: After clicking "Notify Host" in the drawer-disconnected popup, the popup hides locally on the client (patches `drawerDisconnected: false` in room state). The popup may reappear on the next poll if `drawerDisconnected` is still true.
- **Game over on all players leave**: When `removeParticipant()` drops participant count to ≤ 1 during "playing" status, the game ends. A `lastRoundResult` is created from current round state (same structure as `advanceRound()`), status changes to `"finished"`. The remaining player sees the RoundResultCard with only the Exit Game button. The result is not dismissable — the player must exit.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **TypeScript-First (Strict Mode)**: All new types fully typed, strict mode enabled.
- **Extend, Don't Rewrite**: All changes extend existing Room/Participant/RoomSnapshot models + roomStore service. No rewrites.
- **Spec-Driven Development**: Spec artifacts committed before implementation. All FR-034 through FR-059 covered.
- **Deterministic Game Logic**: Disconnect detection is deterministic (lastSeenAt-based). Skip-round uses same deterministic `advanceRound()` from Spec 003. Claim-host is explicit (no auto-promotion).
- **Minimal Dependencies**: No new dependencies required. All new endpoints follow existing Express/Zod patterns.
- **Technical Constraints**: No WebSockets, no DB, no auth, polling-only, Zod validation, functional components, 80% Vitest coverage.
- **No violations detected**: Complexity tracking not required.

## Data Model Changes

### Updated Participant model (backend/src/models/game.ts)

Add to existing `Participant`:
```ts
lastSeenAt: string;  // ISO timestamp, updated on each GET /:code poll
```

### Updated Room model

Add to existing `Room`:
```ts
lastSeenAt?: undefined;  // existing
skipSuggested: boolean;  // new — set by POST /:code/suggest-skip
```

### Updated RoomStatus type

```ts
type RoomStatus = "lobby" | "playing" | "finished";
// Added: "finished" — set when participants drop to ≤ 1 during playing
```

Change:
- `lastRoundResult` stays as-is but `clearExpiredRoundResult()` is removed
- `lastRoundResultSetAt` field is kept but no longer read by auto-clear

### Updated RoomSnapshot model

Add to existing `RoomSnapshot`:
```ts
hostDisconnected?: boolean;   // computed — host's lastSeenAt > 30s ago
drawerDisconnected?: boolean; // computed — drawer's lastSeenAt > 30s ago (playing only)
skipSuggested?: boolean;      // from Room.skipSuggested
```

### Disconnect Detection Logic

```
hostDisconnected = room.status === "playing" &&
  Date.now() - new Date(room.host.lastSeenAt).getTime() > 30000

drawerDisconnected = room.status === "playing" &&
  room.drawerId &&
  Date.now() - new Date(room.drawer.lastSeenAt).getTime() > 30000
```

Note: A participant who has never polled has `lastSeenAt === joinedAt`, so they will appear disconnected 30s after joining if they never poll.

## API Changes

### New Endpoints

| Method | Path | Body | Response | Auth | Notes |
|--------|------|------|----------|------|-------|
| POST | /rooms/:code/restart | `{ playerId }` | `{ room: RoomSnapshot }` | Host only, room playing | Resets to lobby, clears all game state, preserves participants |
| POST | /rooms/:code/claim-host | `{ participantId }` | `{ room: RoomSnapshot }` | Any valid participant | Sets participantId as new hostId. Idempotent. |
| POST | /rooms/:code/skip-round | `{ playerId }` | `{ room: RoomSnapshot }` | Host only, room playing | Calls advanceRound(). Rejects 400 if correct guess exists. |
| POST | /rooms/:code/suggest-skip | `{ participantId }` | `{ room: RoomSnapshot }` | Any participant, room playing | Sets skipSuggested = true |
| DELETE | /rooms/:code/leave | `{ participantId }` | `{ room: RoomSnapshot }` | Any participant | Removes participant. If playing + ≤1 left: ends game with lastRoundResult, status = finished. If 0 left: deletes room, returns null. |

### Extended GET /rooms/:code

Returns additional computed fields when room is in "playing" status:
- `hostDisconnected`: boolean (computed from host's lastSeenAt)
- `drawerDisconnected`: boolean (computed from drawer's lastSeenAt, only if drawerId exists)
- `skipSuggested`: boolean (from room storage)

Also returns `lastRoundResult`, `scores`, and `guessHistory` when status is `"finished"` — same as during "playing", so the remaining player sees the game-over result screen.

### Updated POST /rooms/:code/guess

No behavior change. Correct guess still calls `advanceRound()`. Result screen persists (no auto-expiry).

### Zod Schemas

```ts
export const restartGameSchema = z.object({
  playerId: z.string()
});

export const claimHostSchema = z.object({
  participantId: z.string()
});

export const skipRoundSchema = z.object({
  playerId: z.string()
});

export const suggestSkipSchema = z.object({
  participantId: z.string()
});
```

```ts
export const leaveRoomSchema = z.object({
  participantId: z.string()
});
```

Updated existing:
```ts
export const trimmedNonEmptyString = z.string().trim().min(1).max(20);
```

## Frontend Component Architecture

### New Components
- **HostDisconnectedBanner**: Modal overlay with "Host disconnected" message + "Claim Host" button. Visible on GamePage and LobbyPage when `hostDisconnected` is true and viewer is not host.
- **DrawerDisconnectedBanner**: Modal overlay with "Drawer disconnected" message + "Notify Host" button. Visible on GamePage when `drawerDisconnected` is true and viewer is not host. **After clicking Notify Host**, banner hides locally (client patches `drawerDisconnected: false` in roomStore).

### Modified Components
- **RoundResultCard**: Add full guess history table. Fix name lookup to use participants[]. Add "Continue" button (all players). Add "Restart Game" button (host only). Accept new props: `participants`, `onContinue`, `onRestart`.
- **GamePage**: Wire Continue (local dismiss), Restart Game, Skip Round (host), Claim Host, Suggest Skip handlers. Show HostDisconnectedBanner and DrawerDisconnectedBanner. When `room.status === "finished"` and `lastRoundResult` exists, show RoundResultCard with `onExit` only (no Continue, no Restart) — persistent overlay, player must exit.
- **LobbyPage**: Show HostDisconnectedBanner.

### Button Visibility Matrix

| Button | Host (playing) | Non-host (playing) | Host (result) | Non-host (result) | Anyone (game over) |
|--------|---------------|-------------------|---------------|-------------------|-------------------|
| Continue | — | — | ✅ | ✅ | ❌ |
| Restart Game | — | — | ✅ | ❌ | ❌ |
| Skip Round | ✅ | ❌ | — | — | — |
| Claim Host | ❌ (already host) | ✅ (when host disconnected) | ❌ | ✅ (when host disconnected) | ❌ |
| Notify Host | — | ✅ (when drawer disconnected) | — | — | — |
| Exit Game | ✅ | ✅ | ✅ | ✅ | ✅ |

## Implementation Tasks

### Backend (original)

1. **T036**: Update `Participant` model in `game.ts` — add `lastSeenAt: string`; update `RoomSnapshot` — add `hostDisconnected`, `drawerDisconnected`, `skipSuggested`; update `Room` — add `skipSuggested: boolean`
2. **T037**: Update `createParticipant()` to set `lastSeenAt = now()` on creation
3. **T038**: Update `GET /rooms/:code` handler to update requesting participant's `lastSeenAt` before returning
4. **T039**: Remove `clearExpiredRoundResult()` function and its call in `getRoom()` — `lastRoundResult` persists indefinitely
5. **T040**: Implement `restartGame(code, participantId)` — reset room to lobby status, clear all game state, preserve participants/hostId/code
6. **T041**: Implement `claimHost(code, participantId)` — set `room.hostId = participantId`
7. **T042**: Implement `skipRound(code, playerId)` — validate no correct guess exists (return 400 if so), call `advanceRound()`
8. **T043**: Implement `suggestSkip(code, participantId)` — set `room.skipSuggested = true`; clear `skipSuggested` on `advanceRound()` and `restartGame()`
9. **T044**: Update `toRoomSnapshot()` — compute `hostDisconnected` and `drawerDisconnected` from lastSeenAt; include `skipSuggested`
10. **T045**: Add Zod schemas: `restartGameSchema`, `claimHostSchema`, `skipRoundSchema`, `suggestSkipSchema`; update `trimmedNonEmptyString` with `.max(20)`
11. **T046**: Wire routes: `POST /:code/restart`, `POST /:code/claim-host`, `POST /:code/skip-round`, `POST /:code/suggest-skip`
12. **T047**: Add backend tests for all new endpoints, disconnect detection logic, name validation

### Frontend

13. **T048**: Update `api.ts` — add `restartGame()`, `claimHost()`, `skipRound()`, `suggestSkip()` methods; update `RoomSnapshot` type with `hostDisconnected`, `drawerDisconnected`, `skipSuggested`
14. **T049**: Build `HostDisconnectedBanner` component — modal overlay with "Host disconnected" message + "Claim Host" button
15. **T050**: Build `DrawerDisconnectedBanner` component — modal overlay with "Drawer disconnected" message + "Notify Host" button
16. **T051**: Update `RoundResultCard` — add full guess history table; fix name lookup using `participants[]` prop; add "Continue" button (all players); add "Restart Game" button (host only)
17. **T052**: Update `roomStore` — add `restartGame()`, `claimHost()`, `skipRound()`, `suggestSkip()`, `dismissLastRoundResult()` methods; update `fetchRoom()` to respect local dismissal
18. **T053**: Update `GamePage` — wire Continue (dismiss result), Restart Game, Skip Round, Claim Host, Suggest Skip handlers; show banners for host/drawer disconnect; pass participants to RoundResultCard
19. **T054**: Update `LobbyPage` — show `HostDisconnectedBanner` when host is disconnected
20. **T055**: Update name input fields in create-room and join-room forms with `maxLength={20}`
21. **T056**: Add frontend tests for new components and interactions

### Build & Verify

22. **T057**: Verify both backend and frontend builds pass with `npm run build`

### Feature 1: Notify Host Dismisses Banner (add-on to US5)

23. **T058** [FE] `frontend/src/state/roomStore.ts` — In `suggestSkip()`, after API call succeeds, patch `drawerDisconnected: false` on the local room state so the banner disappears immediately

### Feature 2: Game Over When All Players Leave (US6)

#### Backend

24. **T059** `backend/src/models/game.ts` — Add `"finished"` to `RoomStatus` type
25. **T060** `backend/src/services/roomStore.ts` — Add `removeParticipant(code, participantId)` service: remove participant from array + scores; reassign host if needed; if playing + remaining ≤ 1: create lastRoundResult from current state, set status `"finished"`; if 0 remaining: delete room from store
26. **T061** `backend/src/services/roomStore.ts` — Update `toRoomSnapshot()` to include game details (`lastRoundResult`, `scores`, `guessHistory`) when status is `"finished"` too
27. **T062** `backend/src/api/schemas.ts` — Add `leaveRoomSchema = z.object({ participantId: z.string() })`
28. **T063** `backend/src/api/rooms.ts` — Add `DELETE /:code/leave` route: validate schema, call `removeParticipant()`, return 200 with snapshot
29. **T064** `backend/src/services/roomStore.test.ts` — Add tests: removeParticipant removes correctly, reassigns host, triggers game-over at ≤ 1 participant, deletes room at 0 participants

#### Frontend

30. **T065** `frontend/src/services/api.ts` — Add `api.leaveRoom(code, participantId)` — `DELETE /:code/leave` with body `{ participantId }`
31. **T066** `frontend/src/state/roomStore.ts` — Add `leaveRoom()` method: calls `api.leaveRoom()`, then clears session + stops polling; add `exitGame()` for game-over flow
32. **T067** `frontend/src/pages/GamePage.tsx` — Update `handleExit` to call `roomStore.leaveRoom()`; when `room.status === "finished"` and `lastRoundResult` exists, show `RoundResultCard` with `onExit` only (no `onContinue`, no `onRestart`)

## Out of Scope

- Auto-promote host on disconnect (must use explicit claim-host)
- Skip-round timer or auto-skip
- Persistent storage across server restart
- Spectator mode
- Chat or non-guess messaging
