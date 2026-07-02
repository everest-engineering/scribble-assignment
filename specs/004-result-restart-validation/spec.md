# Feature Specification: Result, Restart & Final Validation (Slice 4)

## Overview
This specification covers displaying round results (correct word, final scores, guess history), host-only restart authorization, and the transition back to the lobby while preserving the player list and clearing all round-specific state.

---

## User Story
```text
As a player,
I want to view the round results and restart the game,
so that we can begin a new game without losing the players in the room.
```

---

## Core Terminology & Data Model Updates
- **Results State**: A new room status (`"results"`) entered after all guessers have correctly guessed the secret word, where the word is revealed to all players.
- **Restart**: A host-only action that resets the room from `"results"` back to `"lobby"`, clearing round state but preserving participants.

### State Schema Extensions

#### `RoomStatus` — Extended
```typescript
// Before
type RoomStatus = "lobby" | "active";

// After
type RoomStatus = "lobby" | "active" | "results";
```

#### State Transitions
```
  ┌──────────┐    start game     ┌──────────┐   all guessers    ┌───────────┐
  │  "lobby"  │ ───────────────> │ "active"  │ ─── correct ───> │ "results" │
  │           │                  │           │                   │           │
  └──────────┘                   └──────────┘                   └───────────┘
       ▲                                                              │
       │                                                              │
       │                    host clicks restart                        │
       └──────────────────────────────────────────────────────────────┘
```

---

## Functional Requirements

### 1. Round End (Transition to Results)
- When all non-drawer participants have submitted a correct guess, the room status MUST automatically transition to `"results"`.
- Once in `"results"` state, the secret word MUST be visible to ALL participants (not just the drawer).
- The drawing, guesses, and scores MUST remain accessible for viewing during the results phase.

### 2. Results Display
- The correct word MUST be displayed to all players.
- The final scores for all players MUST be displayed.
- The complete guess history (ordered list of all submitted guesses) MUST be displayed.

### 3. Restart Authorization
- Only the host (participant whose ID matches `hostId`) can restart the game.
- Non-host restart attempts MUST be rejected with a `403 Forbidden` error.
- The game MUST only be restartable from the `"results"` state. Restarting from `"lobby"` or `"active"` states MUST be rejected.

### 4. Restart Behavior
- Restart MUST return all players to the lobby (`status = "lobby"`).
- The existing participant list MUST be preserved.
- The following round-specific state MUST be cleared:
  - Drawing strokes (`drawing = []`)
  - Guess history (`guesses = []`)
  - Scores (`scores` reset to `0` for all participants)
  - Secret word (`secretWord = undefined`)
  - Current drawer (`drawerId = undefined`)
  - Correct guessers list (`correctGuessers = []`)

### 5. Lobby Re-entry After Restart
- After a restart, all players polling the room state MUST see `status = "lobby"`.
- The polling logic in the frontend lobby page MUST detect `status = "active"` transitions (for regular game starts) and the game page MUST detect `status = "lobby"` transitions (for restart) to automatically navigate clients to the correct page.

---

## Acceptance Criteria

### AC1 — Auto-Transition to Results
- **Given** a game in `"active"` state,
- **When** all guessers have guessed the secret word correctly,
- **Then** the room status transitions to `"results"`.

### AC2 — Word Revealed to All
- **Given** the room is in `"results"` state,
- **When** any player polls the room snapshot,
- **Then** the `secretWord` field is populated for all viewers (not just the drawer).

### AC3 — Results Display
- **Given** a room is in `"results"` state,
- **When** a player views the results screen,
- **Then** they see the correct word, final scores (sorted), and the complete guess history.

### AC4 — Host-Only Restart
- **Given** a room in `"results"` state,
- **When** the host clicks "Restart Game",
- **Then** the room transitions back to `"lobby"` with participants preserved and round state cleared.
- **When** a non-host attempts to restart,
- **Then** the backend rejects with `403 Forbidden`.

### AC5 — Players Return to Lobby
- **Given** a restart has occurred,
- **When** any player polls the room state,
- **Then** `status` is `"lobby"`, all original participants are present, and all round-specific data is cleared.

### AC6 — Player List Preserved
- **Given** a room with 3 participants restarts,
- **When** the lobby is re-entered,
- **Then** all 3 participants remain in the lobby with no changes to the participant list.

---

## Edge Cases & Handling Strategy

| Edge Case | Handling Strategy |
|-----------|-------------------|
| **Non-host attempts to restart** | Backend rejects with `403 Forbidden`. Frontend hides the restart button for non-hosts entirely. |
| **Host disconnects before restarting** | The room remains in `"results"` state. No host migration is implemented — the game is stuck until host reconnects. Future slice can add host migration. |
| **Restart requested multiple times** | After the first restart, status is `"lobby"`. A subsequent restart request (while in `"lobby"`) is rejected with a 400 error. |
| **Player disconnects during restart** | The restart operation is atomic on the server. Disconnected players will see the lobby state when they rejoin (via the room code). |
| **Restart with only one player remaining** | Allowed. The game requires >= 2 players to *start*, but restart only resets state and preserves whatever participants remain. The host will see the "Need at least 2 players" message in the lobby if someone left. |
| **All guessers already guessed before last guess** | The guess that causes `correctGuessers` to cover all non-drawers triggers the transition. The last correct guess is recorded before the status change. |
| **Polling during results phase** | Works identically to existing polling — the 2s interval continues, serving the room snapshot with `status: "results"` and the secret word included. |
