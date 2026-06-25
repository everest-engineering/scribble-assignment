# Discovery Notes

## Incomplete Behaviors Found

1. Room ownership was not represented. `backend/src/models/game.ts` and `backend/src/services/roomStore.ts` had participants but no host identity, so the UI could not enforce host-only start or restart actions.
2. Game lifecycle was lobby-only. `RoomStatus` only allowed `lobby`, and `frontend/src/pages/GamePage.tsx` rendered placeholders instead of a playing/result state.
3. Lobby synchronization was manual. `frontend/src/pages/LobbyPage.tsx` exposed a refresh button but did not poll room snapshots every 2 seconds.
4. Gameplay commands were absent. `backend/src/api/rooms.ts` only supported create, join, and fetch; there were no start, drawing, clear, guess, or restart endpoints.
5. Input validation was too permissive. Empty player names defaulted to `Player`, room codes were not constrained, and frontend API requests pointed at `http://localhost:3001/bug`.

## Assumptions

1. The first round uses the host as drawer because the scenarios say the host or first player should draw first.
2. The deterministic starter word for the first round is the first word in `STARTER_WORDS`, currently `rocket`.
3. A correct guess ends the single required round and moves the room to result state. This gives the lab a clear result path without adding timers or multiple rounds.
4. Drawing sync can use HTTP polling and a saved PNG data URL. No WebSockets or push transport are introduced.

## Relevant Files

- `backend/src/models/game.ts`
- `backend/src/services/roomStore.ts`
- `backend/src/api/schemas.ts`
- `backend/src/api/rooms.ts`
- `frontend/src/services/api.ts`
- `frontend/src/state/roomStore.ts`
- `frontend/src/pages/LobbyPage.tsx`
- `frontend/src/pages/GamePage.tsx`
- `frontend/src/components/DrawingCanvas.tsx`
- `frontend/src/components/GuessForm.tsx`
- `frontend/src/components/ResultPanel.tsx`
- `frontend/src/components/Scoreboard.tsx`
