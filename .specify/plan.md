# Implementation Plan: Scribble — Full Game

**Date**: 2026-06-04

## Summary
Implement 4 scenarios for a multiplayer drawing game: room setup and lobby, game start and drawer flow, gameplay interaction (drawing, guessing, scoring), and result/restart.

## Technical Context
- **Language/Version**: TypeScript 5.x, ES Modules
- **Backend**: Express + Zod, in-memory Map storage
- **Frontend**: React 18 + React Router 6 + Vite
- **Testing**: Vitest
- **Constraints**: No WebSockets (HTTP polling), no databases, no auth

## Implementation Order
1. Fix existing bugs (hostId, snapshot, API URL, schema validation)
2. Scenario 1: auto-polling, start-game endpoint, host/player gating
3. Scenario 2: name validation, drawer assignment, secret word
4. Scenario 3: drawing, guessing, scoring
5. Scenario 4: results display, restart

## Project Structure Changes
- `backend/src/models/game.ts` — Extend RoomStatus, add game state fields
- `backend/src/services/roomStore.ts` — Add startGame, submitGuess, restart, drawing ops
- `backend/src/api/rooms.ts` — Add POST /rooms/:code/start, POST /rooms/:code/guess, POST /rooms/:code/draw, DELETE /rooms/:code/draw, POST /rooms/:code/restart
- `backend/src/api/schemas.ts` — Add schemas for new endpoints, tighten validation
- `frontend/src/services/api.ts` — Add new API methods
- `frontend/src/state/roomStore.ts` — Add auto-polling, new actions
- `frontend/src/pages/LobbyPage.tsx` — Auto-poll, host-only start with min-players check
- `frontend/src/pages/GamePage.tsx` — Wire up canvas, guesses, scores, role display
- `frontend/src/components/GuessForm.tsx` — Submit guesses to API
- `frontend/src/components/Scoreboard.tsx` — Show real scores
- `frontend/src/components/ResultPanel.tsx` — Show guess history
