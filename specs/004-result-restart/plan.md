# Plan: Result, Restart & Final Validation

## State Model Changes
No new model fields needed — all state already exists from 001-003. Restart reuses existing fields.

## Data Flow
1. Round ends → status = round_end → all players see result via polling.
2. Host clicks "Restart" → POST /rooms/:code/restart { participantId }
3. Backend validates host, resets: status=lobby, drawerId=null, secretWord=null, round=0, guesses=[], scores={}, canvasData=null. Participants preserved.
4. Frontend navigates to /lobby; polling continues.
5. Non-host players see lobby updated via their own polling.

## File Changes

### Backend
| File | Changes |
|------|---------|
| `src/api/schemas.ts` | Add restartSchema { participantId } |
| `src/api/rooms.ts` | Add POST /rooms/:code/restart route |
| `src/services/roomStore.ts` | Add `restartGame()`: validate host, reset round state, preserve participants |
| `src/services/roomStore.test.ts` | Test restart logic |
| `src/api/schemas.test.ts` | Test restart schema |

### Frontend
| File | Changes |
|------|---------|
| `src/services/api.ts` | Add `restartGame()` |
| `src/state/roomStore.ts` | Add `restartGame()` method |
| `src/pages/GamePage.tsx` | Show result overlay when status=round_end: correct word, final scores, guess history |
| `src/components/ResultPanel.tsx` | Display correct word + final scores + full guess history |
| `src/pages/LobbyPage.tsx` | Re-show lobby on restart (polling already handles this) |
