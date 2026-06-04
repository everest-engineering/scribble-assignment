# Discovery Notes

## Incomplete Behaviours (Gaps)

### Gap 1: No host tracking on room creation
The starter creates rooms with participants but has no concept of a "host". The `Room` model had no `hostId` field, so there was no way to identify who created the room or enforce host-only actions like starting the game.

**Relevant files**: `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`

### Gap 2: Lobby requires manual refresh
The lobby page had a "Refresh Room" button that required manual clicking to see new participants. There was no automatic polling, meaning players had to remember to refresh or wouldn't see others join.

**Relevant files**: `frontend/src/pages/LobbyPage.tsx`, `frontend/src/state/roomStore.ts`, `backend/src/services/roomStore.ts`

### Gap 3: Game screen is entirely placeholder
The game screen showed placeholder elements with no functionality: the canvas was a styled `<div>` with text, the guess form submitted nothing, the scoreboard showed hardcoded "Waiting for players...", and the result panel showed placeholder copy. No drawing, guessing, or scoring logic existed.

**Relevant files**: `frontend/src/pages/GamePage.tsx`, `frontend/src/components/Canvas.tsx` (did not exist), `frontend/src/components/GuessForm.tsx`, `frontend/src/components/Scoreboard.tsx`, `frontend/src/components/ResultPanel.tsx`

### Gap 4: No player name validation
The starter accepted empty or whitespace-only player names and silently defaulted to "Player". There was no frontend or backend validation to reject invalid names with a clear error message.

**Relevant files**: `frontend/src/pages/CreateRoomPage.tsx`, `frontend/src/pages/JoinRoomPage.tsx`, `backend/src/api/schemas.ts`

## Assumptions

### Assumption 1: Host is always the drawer (deterministic)
We assume the first player (the host who created the room) is always assigned as the drawer. This is a deliberate simplification for a single-round game, avoiding drawer rotation logic that is explicitly out of scope.

### Assumption 2: Secret word is always STARTER_WORDS[0]
We assume the secret word is deterministically selected as the first word from the starter list ("rocket"). This avoids the complexity of random word selection and ensures reproducible testing. Multiple word packs and randomization are out of scope.

### Assumption 3: Polling at 2s is sufficient for gameplay sync
We assume a 2-second polling interval provides acceptable synchronisation for drawing strokes and guess history. This is an intentional trade-off: WebSockets (out of scope) would provide real-time sync, but polling is simpler and meets the lab requirements.

## Relevant Files Summary

### Backend
- `backend/src/models/game.ts` — Core data types (Room, Participant, RoomSnapshot)
- `backend/src/services/roomStore.ts` — In-memory room storage and business logic
- `backend/src/api/rooms.ts` — REST API route definitions
- `backend/src/api/schemas.ts` — Zod validation schemas
- `backend/src/seed/starterData.ts` — Starter word and role data
- `backend/src/api/router.ts` — Express router and error handling

### Frontend
- `frontend/src/pages/CreateRoomPage.tsx` — Create room form
- `frontend/src/pages/JoinRoomPage.tsx` — Join room form
- `frontend/src/pages/LobbyPage.tsx` — Lobby with participant list
- `frontend/src/pages/GamePage.tsx` — Game screen
- `frontend/src/components/GuessForm.tsx` — Guess input component
- `frontend/src/components/Scoreboard.tsx` — Score display component
- `frontend/src/components/ResultPanel.tsx` — Result display component
- `frontend/src/components/Canvas.tsx` — Drawing canvas component
- `frontend/src/state/roomStore.ts` — Client-side reactive state store
- `frontend/src/services/api.ts` — API client
