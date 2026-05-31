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

## Clarifications

The following decisions resolve ambiguities identified in the initial draft. They are based on the README, Scenario 1 conventions, and reasonable defaults.

### C-01 Player Name Validation Scope

AC-01 overlaps with Scenario 1 where frontend name validation was already implemented. Here, AC-01 confirms that validation is enforced **at the point of game start** — the backend must also trim and reject empty/whitespace-only names with a 400 error, ensuring no bypass via direct API calls.

### C-02 Host and First Player Are the Same

The README says "host (or first player)". In Scenario 1 the creator is always the host and is always the first participant. These are always the same person. The host is always the drawer for round 1.

### C-03 Drawer Identification Mechanism

"Clearly identified" means a visible badge (e.g., "drawer" label) rendered next to the drawer's name in the participant list, matching the existing "host" badge style from Scenario 1.

### C-04 Deterministic Word Index

Round numbers are 0-indexed for the calculation. Round 1 uses `words[0]` → "rocket". Formula: `words[(roundNumber - 1) % words.length]`.

### C-05 Non-Drawer Word Display

Non-drawers see a row of underscores equal to the word length (e.g., " _ _ _ _ _ _ " for "rocket"). This provides visual feedback that a word exists without revealing it.

### C-06 Backend Name Validation

The backend `POST /rooms/:code/join` and `POST /rooms` endpoints must trim the player name and reject empty/whitespace-only names with HTTP 400 and a clear error message, matching the frontend validation.

### C-07 Role Storage Model

A `role` field of type `"drawer" | "guesser"` is added directly to each `Participant` object in the room model. This keeps the data model flat and avoids a separate mapping structure.

## Non-Goals

- Multiple rounds or drawer rotation.
- Timer or countdown for drawing phase.
- Custom or random word packs.
- Spectator mode.
- Player disconnection or replacement handling.
