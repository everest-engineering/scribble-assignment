# Starter Codebase Analysis

## Relevant Files

- `README.md`: Defines intended scenarios and explicitly lists missing starter behavior.
- `backend/src/models/game.ts`: Current backend room model only supports `status: "lobby"`.
- `backend/src/services/roomStore.ts`: In-memory room creation, join, and fetch logic.
- `backend/src/api/rooms.ts`: Existing room endpoints: create, join, fetch.
- `backend/src/api/schemas.ts`: Basic Zod schemas; currently permissive.
- `frontend/src/services/api.ts`: Frontend API client only supports create, join, fetch.
- `frontend/src/state/roomStore.ts`: Client-side room session state and manual fetch.
- `frontend/src/pages/LobbyPage.tsx`: Lobby UI with manual refresh and local-only start navigation.
- `frontend/src/pages/GamePage.tsx`: Game page placeholder canvas and static player info.
- `frontend/src/components/GuessForm.tsx`: Guess submit currently prevents default only.

## Incomplete Behaviors

1. Host behavior is missing. Room creation does not mark the creator as host, snapshots do not expose host identity, and lobby start is not host-restricted.
2. Lobby polling is missing. `LobbyPage.tsx` only refreshes when the user clicks `Refresh Room`.
3. Start game is not implemented. The `Start Game` button only navigates to `/game`; there is no backend endpoint, status transition, player-count validation, or shared game state.
4. Player name and room code validation are incomplete. Backend schemas allow optional/empty names and any string room code.
5. Drawer assignment and secret word visibility are missing. `viewerParticipantId` is accepted but ignored in `toRoomSnapshot`.
6. Gameplay is placeholder-only. Drawing, clear canvas, guess submission, synced guess history, scoring, result state, and restart flow are not implemented.

## Assumptions

1. The intended sync model should remain HTTP polling only, matching the README and AGENTS.md restriction against WebSockets.
2. Room state should continue to live entirely in memory through `backend/src/services/roomStore.ts`; no persistence layer should be introduced.
3. The first feature slice should likely extend the existing REST API and shared room snapshot model instead of introducing a new frontend state library.
4. The starter word list in `backend/src/seed/starterData.ts` should be used deterministically for initial gameplay rather than randomized custom packs.

## Result & Restart Gaps

1. The existing game state did not have a completed/result status, so clients had no durable signal that a round ended.
2. Room snapshots did not expose a result-only correct word field for every participant after a correct guess.
3. The result UI needed an explicit result panel that combines the revealed word with the final guess history.
4. Restart behavior needed host-only validation and a clear definition of which round fields must be cleared.
5. Polling clients needed a clear transition from result back to lobby after host restart.

## Result & Restart Assumptions

1. A correct guess immediately ends the round and transitions the room to result state.
2. The selected word may be exposed as `correctWord` only while the room is in result state.
3. Restart preserves the room code, host identity, and participant order while clearing round-specific state.
4. HTTP polling remains the only synchronization mechanism; no push protocol, persistence, or authentication is introduced.
