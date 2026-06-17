# Group 2 — Game Start & Drawer Flow (Scenario 2)

## Acceptance Criteria
2.1. Player names are trimmed on submission; empty or whitespace-only names are rejected with a message.
2.2. When the game starts, the host (first player in participants list) is assigned as the drawer.
2.3. The secret word is deterministically selected from the starter list (based on participant count index).
2.4. The secret word is visible only to the drawer — guessers see "???" or nothing.
2.5. All players see who the drawer is (clearly identified in the UI).

## Edge Cases
- Player name is all whitespace → reject with "Name cannot be empty".
- Player name has leading/trailing spaces → trimmed before saving.
- 2+ players present → game starts; drawer is the first participant (host).
- Room code provided for start must exist; error if room not found.
