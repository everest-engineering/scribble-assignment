# Tasks - Scenario 2 Game Start And Drawer Flow

## Phase 1 - Backend Changes

### T-001 Add Name Validation

Files

- backend/src/models/game.ts
- backend/src/services/roomStore.ts
- backend/src/api/schemas.ts
- backend/src/api/rooms.ts

Dependencies

- None

Goal

- Trim player names on create and join.
- Reject empty or whitespace-only names with a 400 error.

### T-002 Add Role And Word Fields

Files

- backend/src/models/game.ts
- backend/src/services/roomStore.ts

Dependencies

- T-001

Goal

- Add role field to each participant: "drawer" or "guesser".
- Add currentWord and currentRound to the room.

### T-003 Update Start Game With Roles And Word

Files

- backend/src/services/roomStore.ts

Dependencies

- T-002

Goal

- When host starts game, mark host as drawer and others as guesser.
- Set room status to "playing" and current round to 1.
- Pick first word from starter list deterministically.

### T-004 Hide Word From Non-Drawers

Files

- backend/src/services/roomStore.ts

Dependencies

- T-002
- T-003

Goal

- Return actual word only when the requesting player is the drawer.
- Return null for word but include word length for guessers.

## Phase 2 - Frontend Changes

### T-005 Update Frontend Types

Files

- frontend/src/services/api.ts
- frontend/src/state/roomStore.ts

Dependencies

- T-002

Goal

- Add role, currentWord, currentWordLength, and currentRound to frontend types.

### T-006 Add Drawer Identification And Word Display

Files

- frontend/src/pages/GamePage.tsx
- frontend/src/styles/app.css

Dependencies

- T-003
- T-004
- T-005

Goal

- Show drawer badge next to the drawer's name.
- Drawer sees the secret word on screen.
- Guessers see underscores matching the word length.

### T-007 Add Game Page Polling

Files

- frontend/src/pages/GamePage.tsx

Dependencies

- T-006

Goal

- Poll room data every 2 seconds on the game page to keep roles and word in sync.

## Phase 3 - Testing

### T-008 Test Backend Name Validation

Dependencies

- T-001

Goal

- Empty name returns error on create.
- Whitespace-only name returns error on join.

### T-009 Test Role Assignment And Word Selection

Dependencies

- T-003

Goal

- Host gets drawer role after start.
- Non-host gets guesser role.
- Word is picked from starter list in order.
- Room status changes to playing.

### T-010 Test Word Visibility

Dependencies

- T-004

Goal

- Drawer sees the word in API response.
- Guesser gets null for word but receives word length.

### T-011 Test Frontend Display

Dependencies

- T-006

Goal

- Drawer sees the word on the game page.
- Guesser sees underscores.
- Drawer badge is visible to all players.
