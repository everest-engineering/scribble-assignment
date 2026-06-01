# Implementation Plan — Feature Group 2

## State Model Changes

**Backend (`game.ts`):**
- Add `GameRound` interface: `word: string, drawerId: string, status: "drawing" | "results"`
- Add `currentRound: GameRound | null` to `Room`

**Backend (`roomStore.ts`):**
- `startGame` assigns drawer (host), selects word (first unused from starter list)
- `toRoomSnapshot` filters word visibility based on viewerParticipantId

## API Changes

- Existing `POST /rooms/:code/start` returns word for drawer only
- `GET /rooms/:code` returns `drawerId` and word only for drawer

## Data Flow

1. Host starts game -> backend assigns host as drawer, picks word
2. Frontend polls -> detects status "drawing" -> navigates to /game
3. GamePage reads snapshot -> drawer sees word, guessers see hidden

## File-Level Changes

| File | Change |
|------|--------|
| `backend/src/models/game.ts` | Add GameRound, currentRound to Room |
| `backend/src/services/roomStore.ts` | startGame logic, word selection, word visibility |
| `backend/src/seed/starterData.ts` | No changes needed |
| `frontend/src/services/api.ts` | Update typings for game state |
| `frontend/src/pages/GamePage.tsx` | Show/hide word based on role |
| `frontend/src/state/roomStore.ts` | Update types, handle status transition |
| `frontend/src/components/Scoreboard.tsx` | Show role (drawer/guesser) |

## Polling Strategy

- GamePage starts polling on mount (~2s)
- Polls GET /rooms/:code
- Detects status changes for result transition

## Validation Strategy

- Test drawer assignment correctness
- Test word is deterministic
- Test word hidden from non-drawer participants
- Test empty/whitespace names rejected
