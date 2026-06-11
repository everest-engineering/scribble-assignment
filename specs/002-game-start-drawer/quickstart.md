# Quickstart: Game Start & Drawer Flow

## Prerequisites

- Previous feature (Room Setup & Lobby) fully implemented
- Backend running: `cd backend && npm run dev`
- Frontend running: `cd frontend && npm run dev`

## Validation Scenarios

### Scenario 1 — Drawer Assignment

1. Open Tab A → enter name → Create Room
2. Copy room code
3. Open Tab B → enter name → Join Room with code
4. Tab A: click "Start Game" (enabled when 2+ participants)
5. **Verify**: Both tabs show `status: "playing"` within 3 seconds
6. **Verify**: Tab A shows `yourRole: "drawer"` and `drawerId` matches Tab A's participant ID
7. **Verify**: Tab B shows `yourRole: "guesser"` and `drawerId` matches Tab A's participant ID

### Scenario 2 — Secret Word Visibility

1. Follow Scenario 1 steps
2. **Verify**: Tab A (drawer) shows `wordForDrawer` with a word from the starter list
3. **Verify**: Tab B (guesser) does NOT have `wordForDrawer` in response
4. **Verify**: Tab B shows `wordLength` matching the secret word's character count

### Scenario 3 — Deterministic Word Selection

1. Create room A with code XXXX → start game → note the word
2. Create room B with code XXXX → start game → note the word
3. **Verify**: Both rooms selected the same word (same room code → deterministic)
4. Create room C with code YYYY → start game → note the word
5. **Verify**: Room C may have a different word (different code → different selection)

### Scenario 4 — Game Page Display (Minimal)

1. Follow Scenario 1 steps
2. **Verify**: Both tabs navigate to `/game`
3. **Verify**: Tab A displays "You are the drawer" and the secret word
4. **Verify**: Tab B displays "[Drawer name] is drawing" and "Word length: N"
5. **Verify**: No canvas, no chat, no timer elements are present

### Scenario 5 — Polling Continues on Game Page

1. Follow Scenario 1 steps on `/game`
2. Open browser DevTools → Network tab
3. **Verify**: `GET /rooms/:code?participantId=...` continues at ~2s intervals
4. **Verify**: Responses include round data (roundNumber, drawerId, yourRole)
