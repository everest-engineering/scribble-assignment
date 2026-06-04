# Implementation Plan

## Phase 1: Foundation

1. Fix `API_BASE_URL` typo (`/bug` → ``)
2. Update backend types (`game.ts`) — add `hostId`, statuses, `DrawCommand`, `Guess`, scores, drawer
3. Update backend schemas (`schemas.ts`) — name trimming, new request schemas

## Phase 2: Backend Game Logic

4. Update `roomStore.ts` — `startGame`, `submitGuess`, `addDrawCommands`, `clearDrawCommands`, `restartGame`, viewer-aware `toRoomSnapshot`
5. Update `rooms.ts` — new route handlers for start, guess, draw, clear, restart

## Phase 3: Frontend API & Store

6. Update `api.ts` — new types, new API methods
7. Update `roomStore.ts` — new state fields, new actions, host detection

## Phase 4: Frontend Components

8. Create `DrawingCanvas.tsx` — canvas component with draw/clear/replay
9. Update `LobbyPage.tsx` — auto-polling, host check, min players check
10. Update `GamePage.tsx` — canvas integration, results view, polling, restart
11. Update `GuessForm.tsx` — wire up submit, disable for drawer
12. Update `Scoreboard.tsx` — real scores
13. Update `ResultPanel.tsx` — guess history

## Phase 5: Testing

14. Run all tests, fix failures
15. Update existing tests for changed types
