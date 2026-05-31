# Data Model: Game Start & Drawer Flow

## Room Model Updates

We will introduce a `RoundState` interface to track game-specific variables once a game begins.

```typescript
export interface RoundState {
  drawerId: string;
  secretWord: string;
}

export interface Room {
  // existing properties...
  roundState?: RoundState;
}

export interface RoomSnapshot {
  // existing properties...
  roundState?: {
    drawerId: string;
    secretWord?: string; // undefined for guessers
  };
}
```

## State Transitions

- **Lobby -> Game**: When the host starts the game, `status` changes from `"lobby"` to `"in-game"`. `roundState` is initialized with the `hostParticipantId` as `drawerId` and the first item in `STARTER_WORDS` as the `secretWord`.
- **Role Assignment**: Exactly one drawer exists (the host). Guessers are derived dynamically as all participants whose `id` does not equal `drawerId`.
- **Viewer-Specific Snapshots**: The `RoomSnapshot` returned by the API is customized based on the requesting `participantId`:
  - If the requesting participant is the drawer, the `secretWord` is included in `roundState`.
  - If the requesting participant is a guesser, the `secretWord` is completely omitted from `roundState`.
