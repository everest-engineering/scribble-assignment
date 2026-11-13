# Implementation Plan: Result & Restart Flow

**Branch**: `scribble-lab` | **Date**: 2026-06-02 | **Spec**: [spec.md](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/specs/005-result-restart/spec.md)

## Summary
Implement round termination, shared result views exposing the secret word to all guessers, host-only restart mechanics, and cleanup routines resetting participant scores, roles, and round data back to lobby state.

## Technical Context

**Storage**: In-memory store (`roomStore.ts`)
**Testing**: Vitest for checking host-end operations, auto-end evaluation, and restart cleanup.

## Technical Design

### 1. Data Model Extensions (`backend/src/models/game.ts`)
- Update `RoomStatus`:
  ```typescript
  export type RoomStatus = "lobby" | "game" | "result";
  ```

### 2. State & Store Operations (`backend/src/services/roomStore.ts`)
- Implement `endRound(code, participantId)`:
  - Retrieve room. Validate participant is the host (`room.hostId === participantId`).
  - Set `room.status = "result"`.
  - Update `room.updatedAt = now()`.
- Implement auto-end round triggers in `submitGuess`:
  - After appending a correct guess, count unique guessers who have submitted correct guesses.
  - Compare count against the total number of guesser participants (`role === "guesser"`).
  - If all guessers have guessed correctly (and guesser count > 0), set `room.status = "result"`.
- Implement `restartGame(code, participantId)`:
  - Retrieve room. Validate participant is the host (`room.hostId === participantId`).
  - Set `room.status = "lobby"`.
  - Delete `room.round`.
  - Reset each participant: `role = undefined`, `score = 0`.
  - Update `room.updatedAt = now()`.
- Update `toRoomSnapshot`:
  - If `room.status === "result"`, expose the `secretWord` to all participants (so guessers see it in the final view).

### 3. API Routers (`backend/src/api/rooms.ts`)
- Register `POST /rooms/:code/end`: expects body `{ participantId: string }`.
- Register `POST /rooms/:code/restart`: expects body `{ participantId: string }`.
- Validate payloads with `startGameSchema` Zod model (reusing `{ participantId }` check).

### 4. API Client (`frontend/src/services/api.ts`)
- Add functions:
  - `endRound(code: string, participantId: string)`
  - `restartGame(code: string, participantId: string)`

### 5. Game Screen Result Dashboard (`frontend/src/pages/GamePage.tsx`)
- If `room.status === "result"`:
  - Replace the canvas drawing/polling and guess form with a results dashboard.
  - Display: "Round Ended! The secret word was: [SECRET_WORD]"
  - If viewer is host: display a primary action button "Restart Game" calling `api.restartGame`.
  - If viewer is a guest: display a status message "Waiting for host to restart..."
- Add a routing redirect hook:
  ```typescript
  useEffect(() => {
    if (room?.status === "lobby") {
      navigate("/lobby");
    }
  }, [navigate, room?.status]);
  ```

---

## Verification Plan

### Automated Tests
- Write unit tests in `roomStore.test.ts` for:
  - Host ends round successfully.
  - Non-host fails to end round.
  - Guess submission auto-ends round when all guessers are correct.
  - Host restarts game successfully (status goes to lobby, round deleted, roles/scores cleared).
  - Non-host fails to restart game.
  - `toRoomSnapshot` exposes `secretWord` to everyone when status is `"result"`.

### Manual Verification
- Open host and guest windows.
- Start game.
- Draw lines, submit guesses.
- Submit correct guess as guest, verify both windows transition to results view showing scoreboard and word.
- Alternatively, submit incorrect guesses, and click "End Round" on host, verifying results display.
- Host clicks "Restart Game". Verify both windows redirect back to Lobby.
