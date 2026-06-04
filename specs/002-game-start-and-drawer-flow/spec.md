# Game Start & Drawer Flow

## Acceptance Criteria
1. Host clicking Start Game transitions room from lobby to playing.
2. First participant in the room becomes the drawer.
3. Secret word deterministically selected from STARTER_WORDS.
4. Only the drawer sees the secret word. Guessers see "Waiting for drawer...".

## Edge Cases
- No second player: Start Game disabled (handled in Group 1).
- Empty/whitespace names rejected at join/create time (handled in Group 1).
