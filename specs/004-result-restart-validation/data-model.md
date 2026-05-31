# Data Model: Result, Restart & Final Validation

This document describes the data entities, relationships, and state transitions for Feature Group 4.

## Entity Schema Extensions

### 1. Room
The `Room` entity is extended with a new status and winner field:

```typescript
export interface Room {
  code: string;
  status: "lobby" | "in-game" | "result"; // Added "result"
  hostParticipantId: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
  roundState?: {
    drawerId: string;
    secretWord?: string;
  };
  guessHistory: GuessEntry[];
  correctGuesserId?: string | null; // Added: Stores ID of player who guessed correctly
}
```

### 2. Participant
No new fields are added, but score lifecycle behavior is updated:
```typescript
export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  score: number; // Persisted, reset to 0 upon game restart
}
```

---

## State Transition Diagrams

The room status transitions through three states:

```mermaid
stateDiagram-v2
    [*] --> lobby : createRoom()
    lobby --> in-game : startGame() [requires host & >=2 players]
    in-game --> result : submitGuess() [correct guess evaluates to true]
    result --> lobby : restartRoom() [requires host, resets scores/state]
```

### Transition Logic:

1. **`lobby` ➔ `in-game`**:
   * Triggered by host using `POST /rooms/:code/start`.
   * Assigns host as first drawer, sets `secretWord`, sets status to `in-game`.

2. **`in-game` ➔ `result`**:
   * Triggered by correct guess evaluation inside `submitGuess` on backend `roomStore.ts`.
   * Sets `room.status = "result"`.
   * Populates `room.correctGuesserId` with the participant's ID.
   * Note: The secret word becomes visible to all players in `toRoomSnapshot`.

3. **`result` ➔ `lobby`**:
   * Triggered by host using `POST /rooms/:code/restart` which calls the backend `restartRoom()` function in `roomStore.ts`.
   * The `restartRoom()` function MUST atomically reset the room status to `"lobby"`, clear the round-specific state (`roundState = undefined`, `guessHistory = []`, and `correctGuesserId = null`), and reset all connected participants' scores to `0`.
   * Connected players are returned to the lobby state, preserving the participants.
