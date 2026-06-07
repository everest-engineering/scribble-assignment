# Implementation Plan: Gameplay Interaction

**Branch**: `assignment`

## Summary

Implement interactive canvas drawing, guess submission with validation, scoring, and sync via polling.

## Data Flow

### Drawing Flow
1. Drawer draws on canvas → strokes serialized as JSON.
2. On each stroke (debounced) → `POST /rooms/:code/draw` with `{ strokes }`.
3. Backend stores `canvasData`.
4. Guessers poll `GET /rooms/:code` and render canvas from `canvasData`.

### Guess Flow
1. Guesser submits guess → `POST /rooms/:code/guess` with `{ text }`.
2. Backend trims, case-insensitively compares to `currentWord`.
3. If correct: sets `correct: true`, awards 100 points, sets status to `"roundEnd"`.
4. If incorrect: appends guess with `correct: false`, 0 points.
5. All players see updated guess history and scores via polling.

## File-Level Plan

### Backend
| File | Changes |
|------|---------|
| `src/api/schemas.ts` | Add schemas for `submitGuessBody`, `drawBody` |
| `src/services/roomStore.ts` | Add `submitGuess`, `saveDraw` methods |
| `src/api/rooms.ts` | Add `POST /:code/guess`, `POST /:code/draw` handlers |

### Frontend
| File | Changes |
|------|---------|
| `src/services/api.ts` | Add `submitGuess`, `saveDraw` methods |
| `src/state/roomStore.ts` | Add `submitGuess` method |
| `src/pages/GamePage.tsx` | Add interactive canvas for drawer; canvas display for guessers; wire GuessForm |
| `src/components/GuessForm.tsx` | Connect to API; add validation; disable for drawer |
| `src/components/Scoreboard.tsx` | Render dynamic scores from snapshot |
| `src/components/Canvas.tsx` | New component for interactive drawing |

## Implementation Sequence
1. Add draw and guess backend endpoints
2. Implement guess comparison and scoring logic
3. Implement interactive canvas
4. Wire GuessForm to API
5. Update Scoreboard from snapshot
6. Add polling for canvas + guesses + scores
7. Build and test
