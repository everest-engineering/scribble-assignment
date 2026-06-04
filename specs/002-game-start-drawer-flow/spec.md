# Feature Group 2: Game Start & Drawer Flow

**Scenario:** Game Start & Drawer Flow

## Acceptance Criteria

### AC1: Player Name Validation
- Player names are trimmed of leading/trailing whitespace before processing.
- Empty or whitespace-only names are rejected with "Player name is required".
- Validation occurs both client-side (before submit) and server-side (Zod schema).
- The backend returns 400 for invalid names.

### AC2: Drawer Assignment
- When the game starts, the host (room creator) becomes the drawer.
- The `drawerId` in the room snapshot matches the host's participant ID.
- The drawer is clearly identified on the game page with a "Drawer" role indicator.

### AC3: Deterministic Secret Word Selection
- A secret word is deterministically selected from the starter list at game start.
- The same room code always selects the same word (char-code sum modulo word count).
- The selected word is one of: "rocket", "pizza", "castle", "guitar", "sunflower".

### AC4: Drawer-Only Word Visibility
- The `secretWord` field in the room snapshot is present only when the viewer is the drawer.
- Non-drawer viewers receive `secretWord: undefined`.
- The word is displayed prominently on the drawer's game page.
- The GuessForm is hidden from the drawer.
- The drawer sees "Draw the Word!" header; guessers see "Guess the Word!".

## Edge Cases
- Player navigates directly to `/game` without room state -> redirect to `/`
- Only one player in room -> start is blocked (>=2 required)
- No viewer participantId -> secretWord is undefined for everyone
