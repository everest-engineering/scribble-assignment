# Feature Specification: Scenario 2 — Game Start & Drawer Flow

## Purpose
Provide feature-level artifacts for starting the game, assigning the drawer, and ensuring secret word visibility is role-based.

## Scope
- Start the game from the lobby
- Assign the host as the drawer for the first round
- Select a deterministic secret word
- Show the secret word only to the drawer
- Mask the secret word from guessers until result state

## User Stories

### Start Game and Drawer Assignment
As a lobby host, I want to start the game and assign the drawer so the round can begin.

Acceptance Criteria:
- Host starts the game.
- Room status transitions to `game`.
- `drawerId` is assigned to the host.
- Secret word is selected deterministically.

### Drawer Secret Word Visibility
As the drawer, I want to see the secret word and ensure guessers do not.

Acceptance Criteria:
- Drawer sees the secret word in the UI.
- Guessers see a hidden-word message.
- API snapshots mask `secretWord` for guessers while status is `game`.

## Edge Cases
- The drawer must not receive a blank or undefined secret word.
- The guesser snapshot should not expose `secretWord` even if a request is inspected.
- The host is the initial drawer and remains the drawer for the first round.
