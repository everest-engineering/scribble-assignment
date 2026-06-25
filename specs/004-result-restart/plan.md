# Implementation Plan: Result, Restart & Final Validation

## Endpoints

| Method | Path | Body | Auth |
|--------|------|------|------|
| POST | `/rooms/:code/restart` | `{ participantId }` | host only, status must be result |

## Snapshot Changes for Result

When `status === "result"`: include `secretWord` for ALL viewers (not just drawer).

## restartGame Logic

```typescript
function restartGame(code, participantId) {
  // verify host, status === result
  room.status = "lobby";
  room.drawerId = undefined;
  room.secretWord = undefined;
  room.strokes = [];
  room.guesses = [];
  room.participants.forEach(p => p.score = 0);
}
```

## File Changes

### Backend
- `roomStore.ts` — restartGame; toRoomSnapshot exposes secretWord in result for all
- `api/rooms.ts` — restart route

### Frontend
- `GamePage.tsx` — result view UI, host restart button
- `LobbyPage.tsx` — auto-navigate from game when status returns to lobby
- `roomStore.ts` — restartGame action

## Full Flow Validation

1. Tab1 host creates, Tab2 joins
2. Host starts → drawer sees word
3. Drawer draws, guesser guesses wrong then correct
4. Both see result with word/scores/history
5. Host restarts → both in lobby, 2 players, clean state

## Testing

- Unit: restart clears round state, preserves participants
- Manual: full end-to-end two-tab flow
