# Discovery Notes: Scribble Assignment

## Scope

This document captures the initial brownfield discovery for the Scribble monorepo. It records missing/incomplete behavior identified before implementation began, and tracks which items were subsequently resolved.

## Incomplete Behaviors Identified

| # | Discovery | Resolution |
|---|-----------|------------|
| 1 | Lobby synchronization depended on manual refresh and did not satisfy automatic polling expectations. | **Resolved FG001**. `LobbyPage` now polls `GET /rooms/:code` every 2s via `setInterval`, with proper cleanup on unmount and status transitions. |
| 2 | Host-only game start rules and minimum-player preconditions were incomplete in the starter flow. | **Resolved FG002**. `startGame` validates room existence, status (`lobby` only), host role, and minimum 2 players before mutating state. |
| 3 | Gameplay interactions (drawing updates, guess submission validation, and shared guess history) were placeholder-level and not fully wired. | **Resolved FG003**. `CanvasBoard` handles pointer-event strokes; `submitGuess` validates empty/case-insensitive matching, awards 100 points on first correct guess; guess history and scores propagate through polling. |
| 4 | Scoring, result-state display, and restart/reset behavior were not implemented end to end. | **Resolved FG003/FG004**. Scoring is live during gameplay (`submitGuess` awards points); result state (`endRound`) reveals secret word, final scores, and ordered guesses to all players; `restartRoom` atomically clears round state and returns to lobby. |

## Assumptions

1. Multiplayer synchronization must remain HTTP polling based (no WebSockets), with a practical interval near 2 seconds.
2. All room and game state remains in-memory only, and restart behavior does not persist across backend restarts.
3. Deterministic word selection can rely on the provided starter word list without introducing external data sources.

## Relevant Files Reviewed

### Backend

- `backend/src/app.ts`
- `backend/src/server.ts`
- `backend/src/api/router.ts`
- `backend/src/api/rooms.ts`
- `backend/src/api/schemas.ts`
- `backend/src/services/roomStore.ts`
- `backend/src/models/game.ts`
- `backend/src/seed/starterData.ts`

### Frontend

- `frontend/src/App.tsx`
- `frontend/src/routes/index.tsx`
- `frontend/src/state/roomStore.ts`
- `frontend/src/services/api.ts`
- `frontend/src/pages/StartPage.tsx`
- `frontend/src/pages/CreateRoomPage.tsx`
- `frontend/src/pages/JoinRoomPage.tsx`
- `frontend/src/pages/LobbyPage.tsx`
- `frontend/src/pages/GamePage.tsx`
- `frontend/src/components/AppShell.tsx`
- `frontend/src/components/PageHeader.tsx`
- `frontend/src/components/Card.tsx`
- `frontend/src/components/RoomCodeBadge.tsx`
- `frontend/src/components/CanvasBoard.tsx`
- `frontend/src/components/GuessForm.tsx`
- `frontend/src/components/Scoreboard.tsx`
- `frontend/src/components/ResultPanel.tsx`
- `frontend/src/styles/app.css`

### Specification Artifacts

- `specs/001-room-setup-lobby/*`
- `specs/002-game-start-drawer/*`
- `specs/003-gameplay-interaction/*`
- `specs/004-result-restart-flow/*`

## Constraint Verification

- No WebSockets or real-time push protocol used.
- No database or persistent storage introduced.
- No authentication/session/JWT/OAuth flow introduced.
