# Implementation Plan: Gameplay Interaction

**Date**: 2026-06-03 | **Spec**: `specs/003-gameplay-interaction/spec.md`

## Summary

Add interactive canvas for drawer, guess submission endpoint, guess history, and scoring. Canvas is local-only. All game state changes go through the backend.

## State Model Changes

### Backend: `backend/src/models/game.ts`

```typescript
export interface Guess {
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  createdAt: string;
}

export interface Room {
  // ... existing fields
  guesses: Guess[];            // NEW
  scores: Record<string, number>;  // NEW — participantId → score
}

export interface RoomSnapshot {
  // ... existing fields
  guesses: Guess[];            // NEW
  scores: Record<string, number>;  // NEW
}
```

### Backend: `backend/src/api/schemas.ts`

Add `guessSchema` with `participantId` and `text` (min 1 char).

## Data Flow

```
SUBMIT GUESS:
  Guesser → POST /rooms/:code/guess { participantId, text }
  → backend validates: non-empty, not drawer
  → case-insensitive compare against secretWord
  → adds to guesses array
  → if correct and not already scored: sets scores[participantId] = 100
  → returns updated RoomSnapshot

FETCH ROOM (polling):
  GET /rooms/:code?participantId=xxx
  → returns RoomSnapshot with guesses and scores
```

## Files Changed

### Backend (4 files)
| File | Change |
|------|--------|
| `backend/src/models/game.ts` | Add Guess interface, add guesses + scores to Room and RoomSnapshot |
| `backend/src/api/schemas.ts` | Add guessSchema |
| `backend/src/services/roomStore.ts` | Add submitGuess(), init guesses/scores on startGame, include in snapshot |
| `backend/src/api/rooms.ts` | Add POST /:code/guess route |

### Frontend (5 files)
| File | Change |
|------|--------|
| `frontend/src/services/api.ts` | Add Guess type, expand RoomSnapshot, add submitGuess API |
| `frontend/src/state/roomStore.ts` | Add submitGuess method |
| `frontend/src/pages/GamePage.tsx` | Replace canvas placeholder with interactive canvas + clear button |
| `frontend/src/components/GuessForm.tsx` | Wire up to API call instead of no-op |
| `frontend/src/components/ResultPanel.tsx` | Show guess history |
| `frontend/src/components/Scoreboard.tsx` | Show live scores |

## Implementation Sequence

1. Backend model + schema
2. Backend store + routes
3. Frontend types + store
4. Frontend canvas component
5. Frontend GuessForm, ResultPanel, Scoreboard
6. Verify with two browser tabs
