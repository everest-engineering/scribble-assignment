# Feature Specification: Game Start & Drawer Flow

## Overview
The "Game Start & Drawer Flow" feature governs the transition from the pre-game lobby to the active drawing round. It handles the assignment of roles, selection of the secret word, and ensures that sensitive information is only disclosed to the appropriate player. This phase is critical for maintaining the game's integrity and providing a fair experience for all players.

## User Story
**As a host**, I want to be able to start the game when everyone is ready,
**So that** we can begin the drawing and guessing round.

**Given** a game is starting in a lobby with at least 2 players,
**When** the host clicks "Start Game", the room status changes to 'playing'.
**Then** one player (the host/first player) is assigned the 'drawer' role, all others are 'guessers'; a secret word is selected; and only the drawer can see the word.

## Acceptance Criteria

### 1. Game Status Transition
- When the game starts, the room's status must change from `lobby` to `playing`.
- This status change must be propagated to all participants via the existing polling mechanism.
- Upon detecting the `playing` status, all clients must automatically redirect to the game screen.

### 2. Role Assignment
- One player must be designated as the 'drawer' for the round.
- In the initial implementation, the host (or first player in the list) is assigned the drawer role.
- All other participants are assigned the 'guesser' role.
- Role information must be included in the room snapshot so the UI can adapt accordingly.

### 3. Secret Word Selection
- A secret word must be selected from the predefined `STARTER_WORDS` list.
- Initially, the selection can be deterministic (e.g., the first word in the list), but it must be stored in the room state.
- The word is what the guessers will attempt to identify based on the drawer's sketch.

### 4. Data Privacy & Security
- The `secretWord` must be highly protected.
- The backend's `toRoomSnapshot` method must filter the `secretWord` such that it is only included in the response for the drawer.
- Guessers must receive an `undefined` or null value for the `secretWord` in their API response, preventing them from cheating via the browser's network inspector.

### 5. Role-Specific User Interface
- The UI must clearly indicate the player's role (e.g., "You are the Drawer" or "You are a Guesser").
- The drawer must see the secret word they need to draw.
- Guessers must see a placeholder or instructions to wait for the drawing.

## Technical Constraints
- The backend must enforce role-based word visibility in the serialization layer.
- Frontend redirection must be handled within the polling `useEffect` hook to ensure a synchronized start for all players.
