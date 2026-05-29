# Feature Plan: Result State & Restart

## Required Changes

### Backend
- Expose `secretWord` to all participants when `status === "results"`.
- Add host-only `POST /rooms/:code/end` endpoint to transition game → results.
- Add host-only `POST /rooms/:code/restart` endpoint to transition results → lobby.
- Preserve participants and host identity on restart.
- Clear drawer assignment, secret word, drawing, guesses, and scores on restart.

### Frontend
- Add `endRound()` and `restartRoom()` API methods.
- Add host-only result controls in `GamePage.tsx`.
- Render result mode with correct word, final scores, and guess history.
- Redirect players to `/lobby` when polling observes `status === "lobby"` after restart.

## Data Flow
- Host ends round → backend updates `status` to `results`.
- All clients poll room snapshot and render result UI.
- Host restarts → backend resets room state and returns lobby snapshot.
- Clients poll and redirect to `/lobby`.

## File-Level Plan
- `backend/src/api/rooms.ts`: add `end` and `restart` routes.
- `backend/src/services/roomStore.ts`: add `endRound()` and `restartRoom()`.
- `backend/src/api/schemas.ts`: add end/restart request schemas.
- `frontend/src/services/api.ts`: add `endRound()` and `restartRoom()`.
- `frontend/src/pages/GamePage.tsx`: add result view and restart flow.

## Verification
- Confirm the correct word is visible to everyone in results.
- Confirm host-only restart works and non-hosts cannot restart.
- Confirm restart returns all polling participants to lobby.
- Confirm players are preserved and gameplay state is cleared.
