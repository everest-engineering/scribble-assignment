# Data Model: Game Start & Drawer Flow

## New Types

```typescript
interface Round {
  number: number;         // Round number (1, 2, 3...)
  drawerId: string;       // Participant.id of the drawer
  secretWord: string;     // The word to draw
  status: "drawing" | "guessing" | "revealed";
}
```

## Room (updated)

```typescript
interface Room {
  // ... existing fields
  currentRound: number;   // Current round number (0 = not started)
  rounds: Round[];        // History of all rounds
}
```

## RoomSnapshot (updated)

```typescript
interface RoomSnapshot {
  // ... existing fields
  currentRound: number;
  drawerId: string;       // Current round's drawer
  secretWord: string | null;  // Only populated for the drawer
}
```

## Word Selection

```typescript
function selectWord(roundNumber: number): string {
  return STARTER_WORDS[(roundNumber - 1) % STARTER_WORDS.length];
}
```

## State Transitions

- `startGame()`: Sets `currentRound = 1`, creates first Round, assigns host as drawer
- `toRoomSnapshot()`: Populates `secretWord` only if `viewerParticipantId === drawerId`
