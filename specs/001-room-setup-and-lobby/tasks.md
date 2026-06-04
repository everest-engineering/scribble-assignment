# Tasks — Room Setup & Lobby

## Backend
1. Add `isHost` flag to Participant model
2. Mark room creator as host in `createRoom`
3. Validate player name: trim, reject empty/whitespace
4. Add `POST /rooms/:code/start` route with host-only + 2-player check
5. Expose `canStart` in room snapshot

## Frontend
6. Add auto-poll ~2s in LobbyPage
7. Wire Start Game button (host-only, disabled until 2+ players)
8. Show clear error on invalid join code
9. Client-side name validation on Create/Join forms

## Dependencies
- None (this is the first feature group)
