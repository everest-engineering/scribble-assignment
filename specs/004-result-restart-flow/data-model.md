# Data Model: Result, Restart & Final Validation

## Entities

### Room (Updated)
Tracks the last assigned drawer to enable rotation.

```typescript
export interface Room {
  // ... existing fields
  lastDrawerId: string | null; // ID of the most recent drawer
}
```

## State Transitions

1. **Lobby -> Playing**: 
   - Choose next drawer in sequence:
     - If `lastDrawerId` is `null`, pick `participants[0]`.
     - Else find index of `lastDrawerId`, increment by 1 (modulo length).
   - Set `secretWord` and initialize round state.
2. **Playing -> Results**:
   - Host triggers `finishRound`.
   - `room.status` transitions to `results`.
   - `secretWord` becomes visible to all.
3. **Results -> Lobby**:
   - Host triggers `restartGame`.
   - `room.status` transitions to `lobby`.
   - `strokes` and `guesses` cleared.
   - `lastDrawerId` persists to ensure rotation works for the next round.
   - `scores` persist.
