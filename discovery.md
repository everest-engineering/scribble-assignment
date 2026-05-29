# Discovery Notes: Scribble Assignment

## Scope

This document captures the initial brownfield discovery for the Scribble monorepo. It records missing/incomplete behavior identified before implementation, working assumptions, and the key files inspected.

## Incomplete Behaviors Identified

1. Lobby synchronization depended on manual refresh and did not satisfy automatic polling expectations.
2. Host-only game start rules and minimum-player preconditions were incomplete in the starter flow.
3. Gameplay interactions (drawing updates, guess submission validation, and shared guess history) were placeholder-level and not fully wired.
4. Scoring, result-state display, and restart/reset behavior were not implemented end to end.

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

### Frontend

- `frontend/src/App.tsx`
- `frontend/src/routes/index.tsx`
- `frontend/src/state/roomStore.ts`
- `frontend/src/services/api.ts`
- `frontend/src/pages/LobbyPage.tsx`
- `frontend/src/pages/GamePage.tsx`
- `frontend/src/components/CanvasBoard.tsx`
- `frontend/src/components/GuessForm.tsx`
- `frontend/src/components/ResultPanel.tsx`

### Specification Artifacts

- `specs/001-room-setup-lobby/*`
- `specs/002-game-start-drawer/*`
- `specs/003-gameplay-interaction/*`
- `specs/004-result-restart-flow/*`

## Constraint Verification

- No WebSockets or real-time push protocol used.
- No database or persistent storage introduced.
- No authentication/session/JWT/OAuth flow introduced.
