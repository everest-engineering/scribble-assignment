# Feature Specification: Game Start & Drawer Flow

## Description
When a host starts the game from the lobby, the first participant is assigned as the drawer, and the secret word is deterministically selected from the starter word list. The secret word is visible only to the drawer. Player names are validated and trimmed before game start, with empty or whitespace-only names rejected with clear feedback.

---

## User Stories

### US-05 Player Name Validation
As a player,
I want my name to be trimmed of whitespace,
so that accidental spaces don't create awkward display names.

### US-06 Empty Name Rejection
As a player,
I want to be prevented from joining with an empty or whitespace-only name,
so that every participant has a valid display name.

### US-07 Drawer Assignment
As a game participant,
I want the first player to be automatically assigned as the drawer,
so that the game flow begins with a clear role.

### US-08 Secret Word Selection
As the drawer,
I want the secret word to be deterministically selected,
so that it is consistent and fair.

### US-09 Drawer-Only Word Visibility
As a drawer,
I want to see the secret word on my screen,
so that I can draw what I'm supposed to guess.

### US-10 Guesser Word Hiding
As a guesser,
I want NOT to see the secret word,
so that I can guess without having the answer spoiled.

---

## Acceptance Criteria

### AC-09
Player names are trimmed of leading and trailing whitespace before storage.

### AC-10
Empty or whitespace-only player names are rejected with a clear error message during join.

### AC-11
The first participant in the room is assigned the drawer role.

### AC-12
The secret word is deterministically selected (first word from the starter list: "rocket").

### AC-13
The drawer receives the secret word in the room snapshot.

### AC-14
Guessers receive an undefined or empty currentWord in the room snapshot.

### AC-15
The game transitions from lobby to playing state when the host clicks start.

---

## Edge Cases

### EC-06
A player joining with only spaces ("   ") should be rejected.

### EC-07
Player names with valid content but surrounding spaces ("  Alice  ") should be trimmed to "Alice".

### EC-08
Navigating to the game page before start should redirect to lobby.

### EC-09
Multiple players joining simultaneously should all see the same drawer assignment.

---

## Data Requirements

### Participant
- id (UUID)
- name (trimmed string, non-empty)
- isHost (boolean)
- role ("drawer" or "guesser")
- score (number, starts at 0)

### Room
- status transitions from "lobby" to "playing"
- currentDrawerId is set to first participant's ID
- currentWord is set (deterministically: "rocket")

---

## Non-Goals
- Multiple rounds or drawer rotation
- Custom word selection
- Spectator mode
