# Quickstart: Game Start & Drawer Flow

## Validation Checks

To verify this feature locally:

1. **Start the applications**:
   - Backend: `cd backend && npm run dev`
   - Frontend: `cd frontend && npm run dev`

2. **Test Name Validation**:
   - Attempt to create a room with the name `"   "`. Confirm it is rejected.
   - Create a room with `" Host Name "`. Confirm the name appears as `"Host Name"` in the lobby.

3. **Test Drawer Assignment and Word Visibility**:
   - Join the room in a second browser tab with another name.
   - Start the game from the host tab.
   - On the host's screen, confirm the UI indicates they are the drawer and shows the secret word.
   - On the second tab's screen, confirm the UI indicates the host is the drawer and hides the secret word.
