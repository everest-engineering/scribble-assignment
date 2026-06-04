## Observations
Missing `.env`/`.env.example` documentation - The frontend uses the VITE_API_URL environment variable and falls back to `http://localhost:3001/bug` when it is not set (frontend/src/services/api.ts:22). The `/bug` suffix is not a valid backend path, so all API calls fail silently if VITE_API_URL is not configured. No .env or .env.example file is provided to document this option.

Missing player name validation - Both `createRoomSchema` and `joinRoomSchema` define `playerName` as optional string (`backend/src/api/schemas.ts:5-8`) allowing empty or whitespace-only values. In such cases, `displayName()` silently falls back to "Player" (`backend/src/services/roomStore.ts:34`). The create and join forms (`frontend/src/pages/CreateRoomPage.tsx`, `frontend/src/pages/JoinRoomPage.tsx`) likewise permit empty submissions, with no client-side trimming or required-field validation. This behavior makes user input issues and makes the fallback naming logic non-obvious.

State is lost on page refresh - After creating or joining a room and landing on the lobby, a browser refresh sets `room` to `null` in the store, causing `LobbyPage.tsx:14` to redirect back to `/`. The room session exists only in React memory (`frontend/src/state/roomStore.ts`) with no URL-based or persisted recovery mechanism.

No explicit host tracking - The room creator is always the first entry in `participants[]` (`backend/src/services/roomStore.ts:42-49`), but there is no `isHost` field on the `Participant` type (`backend/src/models/game.ts:8-12`). Any host-dependent logic would need to infer ownership by array position, which is fragile.

No minimum player check before starting - The lobby has no guard preventing the game from starting with only one player. The "Start Game" button in `LobbyPage.tsx:50` is always enabled regardless of how many participants are in the room.

"Start Game" is a client-side redirect with no backend interaction - The button in `LobbyPage.tsx:52` calls `navigate("/game")` directly. There is no API request to transition the room status or initialize any game state on the backend.

Guess form submit is a no-op - `GuessForm.tsx:8-10` calls `preventDefault()` and returns without making any API call or state update. The form renders but is completely non-functional.

No room code trimming on the backend - The frontend uppercases the code before sending (`frontend/src/pages/JoinRoomPage.tsx:24-25`), and the backend already calls `.toUpperCase()` on incoming codes (`backend/src/api/rooms.ts:32,51`). However, neither side trims whitespace, so a code like `" ABCD "` would fail to match despite being visually identical.

RoomStatus type only supports "lobby" — The `RoomStatus` type (`backend/src/models/game.ts:2`) is defined as `"lobby"` only, with no `"playing"` or `"finished"` variants. This means the backend has no capacity to track game progress, enforce state transitions, or differentiate between lobby and in-game behavior.

No way to leave the lobby - Once a player creates or joins a room and lands on the lobby page, there is no "Back" or "Leave Room" button to return to the home screen. The only navigation option is "Start Game" which goes to the game page, and from there "Exit Game" goes back to the lobby — creating a dead-end loop (`frontend/src/pages/LobbyPage.tsx`, `frontend/src/pages/GamePage.tsx:69`).

## Assumptions

1. **Host is the first participant** — The room creator is implicitly the host by being first in `participants[]`. Host-only actions (start game, restart) check `participants[0]` rather than an explicit `isHost` field.

2. **Game state is driven by backend** — Starting a game, submitting guesses, and ending rounds all require backend API calls that update room state. The frontend only renders what the backend returns; it does not own game logic.

3. **Player names are required and trimmed** — Empty/whitespace-only names should be rejected with a client-side error message, not silently defaulted to "Player". The `playerName` field should be treated as required with proper validation.

4. **Polling replaces manual refresh** — The lobby and game screens will poll the backend at ~2s intervals (using `setInterval` + `fetch`) instead of requiring a manual refresh button. Polling stops when the component unmounts.

5. **Backend normalizes room codes** — Room codes are case-insensitive. The backend should `.toUpperCase()` and `.trim()` incoming codes in route params to match the frontend behavior and prevent mismatches.

