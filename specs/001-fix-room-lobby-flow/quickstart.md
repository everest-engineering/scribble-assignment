# Quickstart: Fix Room Lobby Flow

## Prerequisites

- Backend running on `http://localhost:3001` (from `backend/`)
- Frontend running on `http://localhost:5173` (from `frontend/`)

## Verification Steps

1. Open `http://localhost:5173` in a browser tab
2. Enter a player name and click **Create and Continue**
3. Confirm you land on the lobby and see yourself in the participant list
4. Open a second browser tab to `http://localhost:5173`
5. Enter a different name, enter the room code from step 2, click **Join Lobby**
6. In the first tab, click **Refresh Room**
7. Confirm both players appear in the participant list

## Validation Tests

| Test | Action | Expected Result |
|------|--------|-----------------|
| Empty name on create | Click "Create and Continue" with blank name | Inline error shown, not navigated |
| Whitespace name on create | Enter "   " and click "Create" | Inline error shown |
| Empty name on join | Click "Join Lobby" with blank name/code | Inline error shown |
| Invalid room code | Enter non-existent code and click "Join" | Inline error from server |
| Refresh loading state | Click "Refresh Room" | Button shows "Refreshing...", disabled until complete |
| Server down | Stop backend, try create/join/refresh | Inline error message shown |
