# Scenario 2 - Game Start And Drawer Flow

## User Story

As a player, I want the game to start fairly with a clearly-identified drawer and a secret word so that I know my role and can begin playing.

## Acceptance Criteria

### AC-01 Player Name Validation

Given a player enters a name on the create or join form

When the name is empty or whitespace-only

Then a clear error message is shown and submission is blocked.

### AC-02 Drawer Assignment

Given a game starts with at least 2 players

When the first round begins

Then the host (room creator) is assigned as the drawer and clearly identified to all players.

### AC-03 Secret Word Selection

Given a round has started

When the drawer is assigned

Then a word is deterministically selected from the starter list and assigned to the round.

### AC-04 Drawer-Only Word Visibility

Given a secret word is assigned

When the game screen loads for each player

Then the word is visible only to the drawer; non-drawers see a hidden indicator instead.

## Edge Cases

- Whitespace-only name is trimmed and rejected with a clear message.
- Game starts with exactly 2 players: host is drawer, other is guesser.
- Deterministic selection uses round index against the starter list order.
- Non-host cannot trigger game start (enforced by Scenario 1 host rules).
- Drawer disconnection before drawing is not handled (out of scope).

## Data Requirements

- Room.status transitions to "playing".
- Participant role field added: "drawer" or "guesser".
- Room stores currentRound word selected deterministically.
- RoomSnapshot exposes currentWord only when viewer is the drawer.
- Starter words: ["rocket", "pizza", "castle", "guitar", "sunflower"].
- Word selection: words[roundNumber % words.length].

## Non-Goals

- Multiple rounds or drawer rotation.
- Timer or countdown for drawing phase.
- Custom or random word packs.
- Spectator mode.
- Player disconnection or replacement handling.
