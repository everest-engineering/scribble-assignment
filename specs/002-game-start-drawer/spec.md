# Feature Specification: Game Start & Drawer Flow (Slice 2)

## Overview
This specification covers starting the game, assigning a drawer, selecting a secret word, and controlling word visibility.

---

## User Story
```text
As a player,
I want the game to start correctly,
so that one player becomes the drawer and only they can see the secret word.
```

---

## Core Terminology & Data Model Updates
- **Drawer**: The participant chosen to draw in the current round.
- **Guesser**: Any participant who is not the drawer.
- **Secret Word**: A word selected from the starter list that the drawer must draw and guessers must guess.
- **Room Status**: Transitions from `"lobby"` to `"active"` when the game starts.

### State Schema Extensions
- **`Room` (Backend)**:
  - Add `drawerId: string | null` (stores participant ID of the drawer).
  - Add `secretWord: string | null` (stores the secret word for the round).
- **`RoomSnapshot` (Shared API)**:
  - Add `drawerId: string | null`.
  - Add `secretWord: string | null` (only populated if the requesting viewer is the drawer).

---

## Functional Requirements

### 1. Name Validation & Trimming
- Player names MUST be trimmed of leading and trailing whitespace before validation.
- Empty or whitespace-only names MUST be rejected with a `400 Bad Request` and message: `"Player name cannot be empty"`.

### 2. Game Start Restrictions
- Only the host (creator of the room) can start the game.
- The game can only start if there are at least 2 players present.

### 3. Drawer Assignment
- When the game starts, the drawer MUST be assigned.
- The default drawer for the first round is the first player in the room's participant list (which is the room host).
- All players in the room must be able to identify who the current drawer is.

### 4. Deterministic Word Selection
- The secret word MUST be selected deterministically from the starter word list: `["rocket", "pizza", "castle", "guitar", "sunflower"]`.
- To make it deterministic for testing and gameplay, selection will be based on the room code (e.g. index = sum of ASCII values of room code characters modulo list length).

### 5. Secret Word Visibility
- The backend MUST only return the `secretWord` in the `RoomSnapshot` if the requester's `participantId` matches the room's `drawerId`.
- Non-drawers (guessers) must not see the secret word in the snapshot (it must be omitted or `undefined`).

---

## Acceptance Criteria

### AC1 - Join Trim Validation
- **Given** a player enters a name with leading/trailing spaces,
- **When** they submit to create or join a room,
- **Then** the name is trimmed before being saved.

### AC2 - Reject Empty Name
- **Given** a player enters an empty or whitespace-only name,
- **When** they attempt to create/join a room,
- **Then** the system rejects the request with status `400` and error message `"Player name cannot be empty"`.

### AC3 - Host-only Start & Min Players
- **Given** a room in lobby state,
- **When** a player attempts to start the game,
- **Then** it succeeds only if the player is the host AND there are >= 2 players.

### AC4 - Drawer Assignment
- **Given** the host starts the game,
- **When** the transition to `"active"` occurs,
- **Then** the first player in the participant list is assigned as the drawer (`drawerId === participants[0].id`).
- **And** all participants receive a snapshot indicating who the drawer is.

### AC5 - Deterministic Word Selection
- **Given** a room starts,
- **When** the secret word is chosen,
- **Then** the word is selected deterministically based on the room code, ensuring repeatable test behavior.

### AC6 - Secret Word Omission (Guesser Privacy)
- **Given** the game has started,
- **When** the drawer fetches the room state,
- **Then** they see the `secretWord`.
- **When** a guesser fetches the room state,
- **Then** they do not see the `secretWord`.

---

## Edge Cases & Handling Strategy

| Edge Case | Handling Strategy |
|-----------|-------------------|
| **Empty/whitespace player name** | Rejected with `400` and message `"Player name cannot be empty"`. |
| **Duplicate player names** | Allowed but each gets a unique `participantId` to ensure unique tracking. |
| **Non-host starts game** | Rejected with `403 Forbidden`. |
| **Secret word list is empty** | Return a fallback default word (e.g., `"rocket"`) or raise an error. |
| **Drawer disconnects/leaves** | Out of scope for this slice, but typically would trigger drawer rotation or end of round. |
