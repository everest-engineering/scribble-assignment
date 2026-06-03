# Feature Spec: Game Start and Drawer Flow

**Feature**: `003-game-start-drawer`
**Parent Assignment Spec**: `specs/001-scribble-game/spec.md`

## User Story

As the host, I want to start a one-round game so that one participant becomes the drawer, all players enter active state, and only the drawer can see the secret word.

## Acceptance Criteria

1. Given a lobby with at least two participants, when the host starts the game, then the room status becomes active.
2. Given a game has started, then every current participant has an initialized score of 0.
3. Given a game has started, then the host or first participant is assigned as drawer for the single round.
4. Given a game has started, then the secret word is selected deterministically from the starter word list.
5. Given the active room is viewed by the drawer, then the drawer sees the secret word.
6. Given the active room is viewed by a guesser, then the guesser does not see the secret word.
7. Given a non-host attempts to start the game, then the action is rejected.
8. Given the game is already active, then another start request is rejected.

## Requirements

- Starting a game MUST create a round state.
- Round state MUST include drawer participant id, secret word, drawing state, guesses, scores, and timestamps.
- Scores MUST be initialized for all participants present at game start.
- The deterministic starter word MUST be stable for automated validation.
- Room snapshots MUST expose `viewerRole`.
- Room snapshots MUST expose `secretWord` only when the viewer is the drawer during active state.
- The lobby MUST navigate players to the game page when polling observes active state.
- The game page MUST render player role and drawer identity.

## Entities

- Round state: drawer id, secret word, drawing, guesses, scores, started time, ended time.
- Participant snapshot: participant identity, host flag, role, score.
- Room snapshot: active status, drawer id, viewer role, optional secret word.

## Validation

Automated validation covers active state transition, score initialization, drawer assignment, deterministic word selection, and viewer-specific secret-word filtering. Frontend render tests cover drawer and guesser views.
