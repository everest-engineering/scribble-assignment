# Discovery Notes

## Incomplete behaviors (starter gaps)

1. **No host model** — any player can click "Start Game" on the lobby; the creator is not tracked as host.
2. **No input validation** — empty player names become `"Player"`; join accepts invalid room codes without clear client-side checks before the API call.
3. **Manual lobby sync only** — participants must click "Refresh Room"; there is no ~2s polling for lobby or gameplay state.
4. **Game screen is placeholder** — canvas, guesses, scoring, drawer word visibility, and result/restart are not wired to the API.
5. **Viewer-agnostic snapshots** — `toRoomSnapshot` ignores `viewerParticipantId`; everyone receives the same payload.
6. **Frontend API base URL typo** — `api.ts` points at `http://localhost:3001/bug`, so requests fail against a real backend unless fixed.

## Assumptions

1. **Round ends on first correct guess** — there is no timer; a correct guess transitions the room to `result` status (single round per lab scope).
2. **Drawer is the host on round start** — Scenario 2 allows "host (or first player)"; we assign the host as drawer for deterministic, testable behavior.
3. **Drawing syncs to all clients via polling** — strokes are stored in-memory on the server and included in `GET /rooms/:code` snapshots so guessers see the canvas update without WebSockets.

## Relevant files

| Area | Files |
|------|--------|
| Backend models | `backend/src/models/game.ts` |
| Room logic | `backend/src/services/roomStore.ts` |
| HTTP API | `backend/src/api/rooms.ts`, `backend/src/api/schemas.ts`, `backend/src/api/router.ts` |
| Seed data | `backend/src/seed/starterData.ts` |
| Frontend API | `frontend/src/services/api.ts` |
| State | `frontend/src/state/roomStore.ts` |
| Pages | `frontend/src/pages/LobbyPage.tsx`, `CreateRoomPage.tsx`, `JoinRoomPage.tsx`, `GamePage.tsx` |
| UI | `frontend/src/components/GuessForm.tsx`, `Scoreboard.tsx`, `ResultPanel.tsx` |
