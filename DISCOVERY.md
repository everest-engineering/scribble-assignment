# Discovery Notes: Scribble Assignment

### 1. Incomplete Behaviors Identified
* **Manual Refresh Dependency:** The lobby does not update automatically when new players join; it requires a physical button click.
* **Lack of Host Tracking:** The system treats all players identically in the backend store; it does not know who created the room or who has permission to start the game.
* **Missing Game Loop Infrastructure:** The canvas, guess inputs, scoreboard, and round transition states are entirely non-functional placeholders.

### 2. Engineering Assumptions
* **Polling Interval:** We assume a ~2-second HTTP polling frequency on the frontend is sufficient for state synchronization without overloading the minimal in-memory backend.
* **Single Round Scope:** We assume the game consists of exactly one round with a deterministic word selection, as multi-round rotation is explicitly out of scope.

### 3. Relevant Files Map
* **Frontend:** `frontend/src/pages/CreateRoomPage.tsx`, `frontend/src/pages/JoinRoomPage.tsx`, `frontend/src/pages/LobbyPage.tsx`, `frontend/src/api/client.ts`
* **Backend:** `backend/src/app.ts`, `backend/src/router.ts`, `backend/src/store.ts`