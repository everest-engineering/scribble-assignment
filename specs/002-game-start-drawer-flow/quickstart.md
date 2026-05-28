# Quickstart: Game Start and Drawer Flow

## Setup
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`

## Verification Flow
1. Open `http://localhost:5173` in **Tab A** (Host).
2. Create room with name " Alice ".
3. Verify name trims to "Alice".
4. Open `http://localhost:5173` in **Tab B** (Guest).
5. Join room with code.
6. In **Tab A**, click "Start Game".
7. Observe both tabs transition to `/game` within 2 seconds.
8. **Tab A** should see the Drawer UI (Canvas) and the word "rocket".
9. **Tab B** should see the Guesser UI (Input form) and NOT see the word "rocket".
10. Open network tab in **Tab B**, inspect the polling response for `GET /rooms/:code?participantId=...` and verify `secretWord` is `null`.
11. Open `http://localhost:5173` in **Tab C** (Late Joiner).
12. Attempt to join the active room.
13. Verify an error message indicates the room cannot be joined (403 Forbidden).
