# Feature Tasks: Room Setup & Lobby

## Tasks
- [ ] Define `hostId` in backend room model and expose it in snapshots.
- [ ] Add room code validation in backend Zod schemas.
- [ ] Normalize codes in backend routes and reject invalid join requests.
- [ ] Add `POST /rooms/:code/start` backend route and host permission check.
- [ ] Add client-side validation to `JoinRoomPage.tsx`.
- [ ] Add 2-second polling to `LobbyPage.tsx`.
- [ ] Add host-only start button logic in `LobbyPage.tsx`.
- [ ] Add `startGame()` API and store action if not already present.
- [ ] Manually verify two-tab lobby sync and host-only start behavior.
- [ ] Add a backend unit test for `hostId` persistence and invalid join codes.
