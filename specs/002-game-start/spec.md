# Feature Group 2 — Game Start & Drawer Flow

## Requirements

- Trim player names: leading/trailing whitespace is stripped
- Reject empty names: names that are empty after trimming are rejected
- Drawer assignment: the host (first participant) becomes the drawer
- Deterministic word selection: the first word from the starter list is selected for the round
- Drawer-only word visibility: only the drawer sees the secret word in the snapshot

## Acceptance Criteria

- AC2.1: Player names are trimmed on create and join
- AC2.2: A name of only whitespace is rejected with a 400 error
- AC2.3: When the game starts, the host is assigned as the drawer
- AC2.4: The selected word is the first word in the starter list that hasn't been used
- AC2.5: The drawer can see the secret word in their game snapshot
- AC2.6: Non-drawer players do not see the secret word in their game snapshot
- AC2.7: Room status transitions to "drawing" after game start

## Edge Cases

- Name with leading/trailing spaces
- Name that is only spaces
- All roles assigned correctly with more than 2 players
