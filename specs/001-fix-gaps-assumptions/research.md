# Technical Research: Fix Gaps and Assumptions

## Summary of Findings

### 1. API Base URL Suffix Bug (G1, A1, A3)
- **Location**: `frontend/src/services/api.ts` (line 22)
- **Code**: `const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/bug";`
- **Issue**: The fallback URL has `/bug` appended, sending all calls to `/bug/rooms`, resulting in 404 errors.
- **Decision**: Correct the fallback URL to `http://localhost:3001` to map frontend requests to valid backend endpoints.

### 2. Player Name Propagation & Fallback (G5)
- **Backend Location**: `backend/src/services/roomStore.ts` (line 32)
- **Code**:
  ```typescript
  function displayName(name?: string) {
    return name || "Player";
  }
  ```
- **Zod Schema Location**: `backend/src/api/schemas.ts` (lines 3-9)
  ```typescript
  export const createRoomSchema = z.object({
    playerName: z.string().optional()
  });
  ```
- **Issue**: The backend Zod schemas treat `playerName` as `.optional()`, and `displayName` falls back to `"Player"` if empty. Furthermore, the frontend pages must properly pass the trimmed non-empty inputs.
- **Decision**:
  - Update `createRoomSchema` and `joinRoomSchema` in `backend/src/api/schemas.ts` to require non-empty strings (e.g. `z.string().min(1)`).
  - Enforce name trimming and validate name inputs on the frontend before calling the API.

### 3. Lobby Refresh Logic (G4, A2)
- **Frontend Location**: `frontend/src/pages/LobbyPage.tsx`
- **Issue**: The Lobby page lists participants and displays the room code. The manual refresh button is wired up but the list must fetch the latest state from the backend correctly.
- **Decision**: Validate that `LobbyPage` uses the `fetchRoom` API call when the manual refresh button is clicked, updating the frontend store state.

## Alternatives Considered

### Option A: Auto-polling in Lobby
- **Pros**: Matches typical lobby expectations.
- **Cons**: Violates the explicit starter gap specification ("manual refresh button only, no auto-polling").
- **Resolution**: Rejected. Stick strictly to manual refresh behavior as specified.
