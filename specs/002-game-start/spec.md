# Scenario 2 Specification: Game Start & Drawer Flow

## Overview
This specification details the requirements, behavior, and validations for starting the game and selecting the drawer for each round.

## Requirements

### 1. Game State Transitions
- The game transition from "Lobby" to "Game" is initiated by the room host.
- When the game starts, the status of the room changes to `ACTIVE` or similar.

### 2. Player Name Validation
- Trim player names using `.trim()`. Rejects empty or whitespace-only names when setting up the initial host/join, showing clear user-facing errors.

### 3. Drawer Assignment
- For the first round, the host (or first player joining) is designated as the drawer.
- The drawer is clearly identified in the game state, and all other players are designated as guessers.
- The UI must display to the drawer that they are drawing, and to other players who is drawing.

### 4. Secret Word Selection & Visibility
- The secret word must be deterministically chosen from the list of starter words: `rocket`, `pizza`, `castle`, `guitar`, `sunflower`.
- The secret word must only be visible to the drawer. Guessers must see underscores corresponding to the letter count (e.g., `_ _ _ _ _ _` for `rocket`).

## Acceptance Criteria

### Game Transition
1. **Given** a Host is in the Lobby, and there are at least 2 players in the room,
   **When** the Host clicks "Start Game",
   **Then** all players in the room are transitioned to the Game screen.

### Drawer Assignment & Word Visibility
1. **Given** the game transitions to the Game screen,
   **When** the first round starts,
   **Then** the drawer is selected, and they can see the secret word.
   **And** other players only see the word placeholder (underscores).
