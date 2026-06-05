# Feature Group 2: Game Start & Drawer Flow

## Scenario

Given a valid lobby is ready to start, when the host starts the game, then player names are trimmed and non-empty, the first player becomes the drawer, the drawer is clearly identified to all participants, a starter word is selected deterministically, and the secret word is visible only to the drawer.

## Acceptance Criteria

1. Given a player enters a name with leading or trailing spaces, when they create or join a room, then the stored participant name is trimmed.
2. Given a player enters an empty or whitespace-only name, when they create a room, then the room is not created and a clear validation error is returned.
3. Given a player enters an empty or whitespace-only name, when they join a room, then the player is not added and a clear validation error is returned.
4. Given a host starts a room with at least 2 valid participants, when the game starts, then the first participant in the room becomes the drawer.
5. Given the game has started, when any participant views the game page, then the drawer is clearly identified by name.
6. Given the game has started, when a room snapshot is fetched, then the selected word is deterministic from the starter word list.
7. Given the drawer fetches the room snapshot, then the secret word is included for that drawer.
8. Given a non-drawer fetches the room snapshot, then the secret word is not included for that non-drawer.
9. Given multiple participants poll the same started room, then all participants see the same drawer identity and round state.
10. Given a room has not started, then no participant sees a drawer assignment or secret word.

## Validation Rules

1. `playerName` is required for both room creation and room join.
2. `playerName` must be trimmed before validation and storage.
3. Trimmed `playerName` must contain at least 1 character.
4. Validation failures for `playerName` must return a clear API error message and must not mutate room state.
5. The first player means the earliest participant in the room's participant list.
6. Drawer assignment occurs when the game transitions from lobby to started state.
7. Drawer assignment must be stored in the in-memory room state so all future snapshots agree.
8. Word selection must be deterministic and must use the existing starter word list.
9. For this feature group, deterministic word selection uses the first starter word unless the later plan explicitly defines another deterministic rule.
10. Room snapshots must expose the drawer identity to all participants.
11. Room snapshots must expose the secret word only when `viewerParticipantId` matches the drawer participant id.
12. Room snapshots must omit or null the secret word for non-drawers.

## Edge Cases

1. Create-room name is empty.
2. Create-room name is whitespace-only.
3. Join-room name is empty.
4. Join-room name is whitespace-only.
5. Player name contains leading or trailing whitespace around valid text.
6. Player name contains internal repeated spaces; internal spacing is preserved after trimming.
7. Existing rooms created before the feature change do not have drawer or word state yet.
8. A room is fetched without `participantId`; secret word must not be visible.
9. A room is fetched with an unknown `participantId`; secret word must not be visible.
10. A non-drawer directly calls the room-fetch API with their own participant id; secret word must not be visible.
11. The host starts the game after a second player joins; drawer remains the first participant, not the most recent joiner.
12. The starter word list is unexpectedly empty; game start must fail gracefully rather than exposing undefined state.
