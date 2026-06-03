# Scribble Assignment Discovery Notes

**Date**: 2026-06-03
**Branch**: `sdd-scribble-assignment`
**Project type**: Brownfield enhancement

## Starter Summary

The starter is a runnable Scribble-style app with a React/Vite frontend and an Express/TypeScript backend. It supports creating a room, joining an existing room by code, fetching a room snapshot, and showing participants in the lobby. The backend stores rooms in memory and exposes `GET /health`, `POST /rooms`, `POST /rooms/:code/join`, and `GET /rooms/:code`.

The UI includes Start, Create Room, Join Room, Lobby, and Game screens. The Game screen is scaffolded with placeholder areas for canvas, guesses, scoreboard, and results.

## Incomplete Behaviors

1. Host tracking is missing. The backend does not record which participant created the room, and the frontend lets any participant navigate to the game.
2. Player name validation is incomplete. Empty or whitespace-only names become `"Player"` instead of being rejected with clear feedback.
3. Lobby synchronization is manual. The lobby has a `Refresh Room` button but no polling cadence near 2 seconds.
4. Game lifecycle is missing. Room status only supports `lobby`; there is no start-game endpoint, active round state, result state, or restart flow.
5. Drawer and word assignment are missing. Starter roles and words exist as seed data but are only exposed in snapshots.
6. Viewer-specific behavior is missing. `toRoomSnapshot` ignores `viewerParticipantId`, so all viewers receive the same data.
7. Gameplay is non-functional. The canvas is a placeholder, guess submission does nothing, scoring is absent, and result history is not tracked.

## Assumptions

1. The first implemented version supports exactly one round per game session before the result/restart flow. Multiple rounds and drawer rotation are out of scope.
2. The room creator is always the host. If the host restarts the game, the same participants remain in the room and the host remains unchanged.
3. The deterministic word for the assignment can be the first starter word, `rocket`, unless the spec later defines a different deterministic selection rule.
4. Polling every 2 seconds is sufficient for lobby, game, guess history, result, and restart synchronization.
5. Drawing can be represented as serializable stroke data in memory rather than pixel images or persistent files.

## Relevant Files

### Backend

- `backend/src/models/game.ts`: Current room, participant, role, and snapshot types.
- `backend/src/services/roomStore.ts`: In-memory room creation, join, fetch, save, and snapshot logic.
- `backend/src/api/rooms.ts`: Room API routes.
- `backend/src/api/schemas.ts`: Request validation schemas and `HttpError`.
- `backend/src/seed/starterData.ts`: Starter word list and roles.
- `backend/src/services/roomStore.test.ts`: Current backend service tests.
- `backend/src/api/schemas.test.ts`: Current validation tests.

### Frontend

- `frontend/src/state/roomStore.ts`: External room state store and room API actions.
- `frontend/src/services/api.ts`: Frontend API client and response types.
- `frontend/src/pages/CreateRoomPage.tsx`: Create room form.
- `frontend/src/pages/JoinRoomPage.tsx`: Join room form.
- `frontend/src/pages/LobbyPage.tsx`: Lobby display and manual refresh.
- `frontend/src/pages/GamePage.tsx`: Placeholder game screen.
- `frontend/src/components/GuessForm.tsx`: Guess input placeholder.
- `frontend/src/components/Scoreboard.tsx`: Scoreboard placeholder.
- `frontend/src/components/ResultPanel.tsx`: Result placeholder.
- `frontend/src/styles/app.css`: Shared styling.

## Discovery Risks

- The starter frontend API base URL currently defaults to `http://localhost:3001/bug`, so local runs likely require `VITE_API_URL` unless this is corrected in the implementation plan.
- Browser-based two-player validation requires running backend and frontend servers simultaneously.
- In-memory state makes isolation and reset logic easier, but tests must avoid leaking rooms across cases.

