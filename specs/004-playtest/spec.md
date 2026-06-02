# Feature Specification: Drawing Canvas & Playtest Improvements

**Feature Branch**: `004-playtest`  
**Created**: 2026-06-01  
**Status**: Draft  
**Depends On**: `001-gameplay-flow`, `002-room-polish`, `003-api-contracts`  
**Input**: Gameplay feedback showing need for actual drawing canvas and score display fixes.

## Overview

This feature implements the drawing canvas UI for the drawer and fixes scoring display on the scoreboard. The goal is to complete core gameplay by enabling the drawer to draw and ensuring all players see accurate scores in real-time.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawing Canvas (Priority: P1)

The drawer can draw on a canvas with strokes that appear to all players in real-time (via polling).

**Why this priority**: Drawing is core to the game; without it, Scenario 3 cannot pass.

**Independent Test**: Start game as drawer, draw on canvas, verify guessers see the drawing, submit guess and verify drawing persists.

**Acceptance Scenarios**:

1. **Given** the player is the drawer and a round is active, **When** they view the game page, **Then** they see a canvas (HTML5 canvas or div-based drawing area) ready for drawing.
2. **Given** the drawer draws on the canvas with mouse/touch, **When** each stroke is completed, **Then** the stroke is sent to the server and the drawer sees it immediately on their canvas.
3. **Given** guessers are viewing the game, **When** the drawer submits strokes, **Then** the guessers see the drawing update within ~2 seconds (next polling cycle).
4. **Given** the drawer draws multiple strokes, **When** the canvas is full, **Then** there is a "Clear Canvas" button that clears all strokes and resets the drawing.
5. **Given** a round ends, **When** the result screen is displayed, **Then** the final drawing is shown (not cleared) so guessers can see what was drawn.

---

### User Story 2 - Scoreboard Display (Priority: P1)

The scoreboard shows accurate, up-to-date scores for all players throughout gameplay.

**Why this priority**: Scoreboard currently shows no scores; players cannot see who is winning.

**Independent Test**: Complete a round, verify scoreboard shows correct scores for all players.

**Acceptance Scenarios**:

1. **Given** players are in the lobby, **When** they view the scoreboard, **Then** it displays each player's name and cumulative score (0 if first round).
2. **Given** a guesser submits a correct guess during gameplay, **When** the next polling cycle happens, **Then** the scoreboard updates to show +100 points for that player.
3. **Given** multiple guesses are submitted (correct and incorrect), **When** polling updates occur, **Then** the scoreboard reflects the latest scores accurately.
4. **Given** a round ends and restart is triggered, **When** the lobby reappears, **Then** the scoreboard still shows cumulative scores (not reset).
5. **Given** the result screen is displayed, **When** the scoreboard is visible, **Then** it shows final scores for that round and cumulative totals.

---

### User Story 3 - Host Restart Button (Priority: P2)

The host has a visible, easy-to-use button to restart the game and return to the lobby.

**Why this priority**: Host-only restart is implemented in backend but missing from UI; without it, Scenario 4 cannot complete.

**Independent Test**: End a round, see result screen, click restart button (as host only), verify lobby reappears.

**Acceptance Scenarios**:

1. **Given** a round has ended and the result screen is displayed, **When** the host views the page, **Then** they see a prominent "Restart Game" button.
2. **Given** a non-host player views the result screen, **When** they look for the restart button, **Then** it is not visible (grayed out or hidden).
3. **Given** the host clicks "Restart Game", **When** the request is processed, **Then** the room returns to the lobby state with all players preserved.
4. **Given** players are in the result screen, **When** they are waiting for the host to restart, **Then** a message explains "Waiting for host to restart..." and auto-polls for restart.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-301**: The drawer MUST see an HTML5 canvas or drawing area (min 800x600 pixels) when a round is active.
- **FR-302**: Drawing strokes MUST be sent to the server endpoint `/rooms/:code/rounds/current/canvas` after each stroke completion.
- **FR-303**: Guessers MUST see the updated drawing within ~2 seconds (next polling cycle) via the canvas data in the room snapshot.
- **FR-304**: The canvas MUST have a "Clear Canvas" button that clears all strokes and resets the canvas to blank.
- **FR-305**: The result screen MUST display the final drawing (not clear it) so all players can see what was drawn.
- **FR-306**: The scoreboard MUST display all players with their current scores, updated in real-time (via polling).
- **FR-307**: Scores MUST be cumulative (not reset between rounds) and persist across the room lifecycle.
- **FR-308**: When a correct guess is submitted, the scoreboard MUST update to reflect +100 points for that player on the next polling cycle.
- **FR-309**: The host MUST see a prominent "Restart Game" button on the result screen.
- **FR-310**: Non-host players MUST NOT see or be able to interact with the restart button; instead they see "Waiting for host to restart...".
- **FR-311**: Clicking "Restart Game" MUST call `/rooms/:code/restart` and return to the lobby with players preserved.

### Constraints

- Canvas size is fixed at 800x600 pixels.
- Drawing strokes are sent individually (not batched).
- Canvas rendering uses HTML5 Canvas API or SVG (backend agnostic).
- No database; canvas is in-memory only (lost on server restart).
- All score updates happen via polling (no WebSockets).

### Key Interactions

- **Drawing workflow**: Drawer draws → stroke sent → guessers see via polling → guess submitted → score updated → restart available
- **Scoreboard display**: Visible in lobby, gameplay, and result screens; always shows cumulative scores
- **Restart flow**: Host clicks button → lobby reappears → scores preserved → players ready for next round
