# Reflection Report

## What did the starter app already have?

The starter application provided the basic foundation for the Scribble game. It included:

- App shell with routing between all screens.
- Branded Scribble landing page and starter UI.
- Ability to create a room with a unique room code.
- Ability to join an existing room using a valid room code.
- Lobby displaying the room code and participant list.
- Backend APIs for creating rooms, joining rooms, and retrieving room information.
- In-memory room storage.
- A manual lobby refresh mechanism.

The application supported only the happy path for room creation and joining. Core gameplay functionality was not implemented.

---

## What did I add?

I implemented all four required scenarios to transform the starter project into a functional multiplayer Scribble game.

### Scenario 1 – Room Creation & Lobby
- Validated room creation and joining.
- Rejected invalid or empty room codes.
- Added automatic lobby polling.
- Restricted game start to the host.
- Enforced a minimum player count before starting.

### Scenario 2 – Game Start & Drawer Flow
- Validated and trimmed player names.
- Rejected empty or whitespace-only names.
- Started the game from the lobby.
- Assigned the first drawer.
- Selected a secret word from the starter word list.
- Ensured only the drawer could view the secret word.

### Scenario 3 – Gameplay Interaction
- Added drawing and canvas clearing functionality.
- Implemented guess submission.
- Trimmed and validated guesses.
- Compared guesses case-insensitively.
- Synchronized guess history.
- Implemented scoring (100 points for correct guesses, 0 for incorrect guesses).

### Scenario 4 – Result & Restart
- Displayed the correct word at the end of the round.
- Displayed final scores.
- Displayed complete guess history.
- Allowed only the host to restart the game.
- Preserved players while returning everyone to the lobby.
- Cleared all round-specific game state to prepare for a new game.

---

## Summary

The starter application provided only the room creation and lobby foundation. My implementation completed the core gameplay by adding game start, drawer selection, secret word handling, gameplay interactions, scoring, results, and game restart, satisfying all four required scenarios.