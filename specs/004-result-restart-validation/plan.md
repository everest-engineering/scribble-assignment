# Technical Implementation Plan — Result, Restart & Final Validation (Slice 4)

## Overview
This document describes the technical plan for Slice 4: auto-transitioning to a results state when all guessers guess correctly, revealing the secret word to all players, displaying final results, and implementing a host-only restart that resets round state while preserving the player list.

---

## Proposed Changes

### 1. Model Updates (Shared)

#### [MODIFY] `backend/src/models/game.ts`
- Extend `RoomStatus` to include `"results"`:
  ```typescript
  export type RoomStatus = "lobby" | "active" | "results";
  ```

#### [MODIFY] `frontend/src/services/api.ts`
- Update `RoomSnapshot.status` type to include `"results"`:
  ```typescript
  status: "lobby" | "active" | "results";
  ```

---

### 2. Backend Logic & Services

#### [MODIFY] `backend/src/services/roomStore.ts`

- **`submitGuess(code, participantId, text)`** — Auto-transition to results:
  - After a correct guess is recorded and the guesser is added to `correctGuessers`, check if ALL non-drawer participants are now in `correctGuessers`.
  - If so, set `room.status = "results"`.
  ```typescript
  const allNonDrawersGuessedCorrectly = room.participants
    .filter((p) => p.id !== room.drawerId)
    .every((p) => room.correctGuessers.includes(p.id));

  if (allNonDrawersGuessedCorrectly) {
    room.status = "results";
  }
  ```

- **`restartGame(code, hostParticipantId)`** — New function:
  - Validate room exists (`404` if not).
  - Validate caller is host (`403` if not).
  - Validate status is `"results"` (`400` if not).
  - Reset round state:
    - `status = "lobby"`
    - `drawerId = undefined`
    - `secretWord = undefined`
    - `guesses = []`
    - `drawing = []`
    - `correctGuessers = []`
    - Reset all participant scores to `0`.
  - Participants array is NOT modified.
  - Save and return cloned room.

- **`toRoomSnapshot(room, viewerParticipantId)`** — Reveal word in results:
  - Include `secretWord` in snapshot when `status === "results"`, regardless of viewer role:
  ```typescript
  if (room.drawerId && (viewerParticipantId === room.drawerId || room.status === "results")) {
    snapshot.secretWord = room.secretWord;
  }
  ```

#### [MODIFY] `backend/src/api/rooms.ts`
- Add import for `restartGame`.
- Add route `POST /rooms/:code/restart`:
  - Parse code from params and `participantId` from body via `participantActionSchema`.
  - Call `restartGame(code, participantId)`.
  - Return updated room snapshot.

---

### 3. Frontend API & Store Integrations

#### [MODIFY] `frontend/src/services/api.ts`
- Add `restartGame(code, participantId)`:
  ```typescript
  restartGame(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/restart`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  }
  ```

#### [MODIFY] `frontend/src/state/roomStore.ts`
- Add `restartGame()` method:
  ```typescript
  async restartGame() {
    if (!this.state.room || !this.state.participantId) return null;
    const response = await this.withLoading(() =>
      api.restartGame(this.state.room!.code, this.state.participantId!)
    );
    this.setRoomSnapshot(response.room);
    return response.room;
  }
  ```

---

### 4. Frontend UI — Results View

#### [MODIFY] `frontend/src/pages/GamePage.tsx`
- When `room.status === "results"`, render a **Results View** instead of the game canvas:
  - Display the correct word prominently.
  - Show the existing `Scoreboard` component (already reading from `room.scores`).
  - Show the existing `ResultPanel` component (already reading from `room.guesses`).
  - If the viewer is the host: show a **"Restart Game"** button that calls `roomStore.restartGame()` and navigates to `/lobby`.
  - If the viewer is not the host: show a **"Waiting for host to restart..."** message.
- When `room.status === "lobby"` (detected via polling), navigate to `/lobby`.

---

### 5. Existing Components (No Changes Needed)

#### `frontend/src/components/Scoreboard.tsx`
- Already reads `room.scores` and `room.participants` — renders final scores automatically.

#### `frontend/src/components/ResultPanel.tsx`
- Already reads `room.guesses` — renders full guess history automatically.

#### `frontend/src/pages/LobbyPage.tsx`
- Already polls `room.status === "active"` to navigate to `/game`.
- After restart, the lobby will display the preserved participant list and the host can start a new game when ready.

---

## Verification Plan

### Automated Tests

Write new tests in `backend/src/services/roomStore.test.ts`:

- **Auto-transition to results**: Create a room, start game, have all guessers guess correctly — verify `status === "results"`.
- **Results reveal word**: In results state, verify `toRoomSnapshot` includes `secretWord` for all viewers.
- **Restart clears state**: Restart a room and verify `status === "lobby"`, `drawing === []`, `guesses === []`, `scores === {all: 0}`, `secretWord === undefined`, `drawerId === undefined`.
- **Restart preserves participants**: Verify participant list is identical before and after restart.
- **Non-host restart rejection**: Verify a non-host gets `403` when calling `restartGame()`.
- **Restart from non-results state**: Verify restarting from `"lobby"` or `"active"` throws `400`.

### Manual Verification Flow (2 Browser Tabs)

1. **Setup**: Host Tab A and Guest Tab B in lobby. Host starts game.
2. **Round Completion**:
   - Tab B (guesser) submits the correct word.
   - Both tabs transition to the results view.
   - Both tabs see the correct word, final scores, and guess history.
3. **Restart**:
   - Tab A (host) clicks "Restart Game".
   - Both tabs navigate back to the lobby.
   - Participant list shows both players.
   - Scores are cleared.
4. **Non-host restart attempt**:
   - In results state, verify there is no restart button for the non-host.
5. **New game after restart**:
   - Host can start a new game from the lobby with the same players.

---

## File Change Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `backend/src/models/game.ts` | Modify | Add `"results"` to `RoomStatus` |
| `backend/src/services/roomStore.ts` | Modify | Auto-transition in `submitGuess`, add `restartGame`, update `toRoomSnapshot` |
| `backend/src/api/rooms.ts` | Modify | Add `POST /:code/restart` route |
| `frontend/src/services/api.ts` | Modify | Add `"results"` to status type, add `restartGame` API method |
| `frontend/src/state/roomStore.ts` | Modify | Add `restartGame()` store action |
| `frontend/src/pages/GamePage.tsx` | Modify | Add results view with restart button and lobby navigation |
