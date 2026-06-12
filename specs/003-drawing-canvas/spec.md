# Feature Specification: Drawing Canvas

**Feature Branch**: `003-drawing-canvas`

**Created**: 2026-06-08

**Status**: Draft

**Input**: User description: "Implement an interactive drawing canvas so the drawer can draw and guessers can see the drawing in real-time via polling"

## Clarifications

### Session 2026-06-11

- Q: Canvas lifecycle across rounds → A: Per-round — canvas is automatically created when a round starts and cleared when a new round begins
- Q: Stroke identity model → A: UUID — each stroke gets a unique UUID generated client-side by the drawer's client
- Q: Stroke completion trigger → A: Mouse-up — a stroke is considered complete and ready for sync when the user lifts the mouse/touch
- Q: Poll failure UX for drawing sync → A: Subtle non-blocking indicator — silently retry on failure, show a small "connection issue" indicator that auto-clears on next successful poll
- Q: Drawing data retention → A: End-of-round — previous round's strokes are discarded immediately when a new round begins, keeping memory footprint minimal

## User Scenarios & Testing

### User Story 1 - Drawer Draws on Canvas (Priority: P1)

The assigned drawer can draw on an interactive canvas using a brush tool with colour selection. The canvas responds to mouse/touch input for freehand drawing.

**Why this priority**: The drawing canvas is the primary interaction for the drawer. Without it, there is no way for the drawer to communicate the secret word visually.

**Independent Test**: Can be tested by opening the game as the drawer and verifying that drawing strokes appear on the canvas as the user drags the mouse.

**Acceptance Scenarios**:

1. **Given** a player is the drawer in an active round, **When** they click and drag on the canvas, **Then** freehand strokes appear following the mouse path
2. **Given** a player is the drawer in an active round, **When** they select a different colour from the colour palette and draw, **Then** strokes appear in the selected colour
3. **Given** a player is a guesser in an active round, **When** they view the canvas, **Then** the canvas is read-only and cannot be drawn on
4. **Given** a player is the drawer, **When** they use a thin brush width, **Then** strokes appear thinner than when a thick brush width is selected

---

### User Story 2 - Drawing Syncs to Guessers (Priority: P1)

As the drawer draws, the canvas updates appear on guessers' screens so they can see the drawing in near-real-time.

**Why this priority**: The core of the game is guessers interpreting the drawing. Without syncing, guessers cannot see what the drawer is creating.

**Independent Test**: Can be tested by opening the game as drawer in one window and as guesser in another window, then verifying that strokes drawn in the drawer window appear in the guesser window.

**Acceptance Scenarios**:

1. **Given** a drawer is drawing on the canvas, **When** they complete a stroke and lift the mouse, **Then** the stroke appears on all guessers' canvases within 2 seconds
2. **Given** a guesser's canvas has been synced with drawing data, **When** they view the canvas, **Then** it shows all strokes drawn by the drawer so far

---

### User Story 3 - Drawer Clears the Canvas (Priority: P2)

The drawer can clear the canvas to start over, which also clears it for all guessers.

**Why this priority**: The drawer may make mistakes or want to restart their drawing. A clear action keeps the game moving.

**Independent Test**: Can be tested by the drawer drawing some strokes, clicking clear, and verifying the canvas is empty for both drawer and guessers.

**Acceptance Scenarios**:

1. **Given** a drawer has drawn strokes on the canvas, **When** they click the clear canvas button, **Then** all strokes are removed from the drawer's canvas
2. **Given** a drawer has cleared the canvas, **When** guessers view their canvas, **Then** all strokes are removed from guessers' canvases within 2 seconds

---

### Edge Cases

- What happens if the drawer switches to a new colour mid-stroke? Colour changes should only apply to new strokes, not retroactively
- What happens when the canvas is very small or very large? The canvas should maintain aspect ratio and scale appropriately
- What happens if the browser window is resized? The canvas drawing should remain intact and visible
- What happens if a guesser joins mid-round? They should see the current state of the drawing
- What happens at round transition? The canvas is automatically cleared for all participants when a new round begins — no manual clear needed

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide an interactive drawing canvas for the drawer with mouse-based freehand drawing
- **FR-002**: System MUST provide a colour palette with at least 8 distinct colours for the drawer to choose from
- **FR-003**: System MUST provide at least 3 brush width options (thin, medium, thick)
- **FR-004**: System MUST render the canvas as read-only for guessers (no drawing interaction)
- **FR-005**: System MUST persist drawing strokes on the backend as the canonical drawing state
- **FR-006**: System MUST sync completed strokes (triggered on mouse-up) from drawer to all guessers within 2 seconds
- **FR-007**: System MUST provide a clear canvas action available only to the drawer
- **FR-008**: System MUST sync the cleared canvas state to all guessers within 2 seconds
- **FR-009**: System MUST allow guessers joining mid-round to receive the full current drawing state
- **FR-010**: System MUST store drawing data as individual strokes with colour, width, and a client-generated UUID per stroke
- **FR-013**: System MUST automatically clear the canvas for all participants when a new round begins — the drawer does not need to manually clear between rounds. Previous round's strokes MUST be discarded from memory immediately on round transition

- **FR-011**: System MUST provide guessers with a polling mechanism to fetch the latest drawing state at regular intervals (2 seconds, matching the lobby polling cadence). On poll failure, show a subtle non-blocking indicator that auto-clears on the next successful poll; do not interrupt the user experience

- **FR-012**: System MUST provide the drawer with a clear canvas action only — no undo action is needed

### Key Entities

- **Stroke**: Represents a single drawing stroke. Uniquely identified by a UUID generated client-side by the drawer. Contains an ordered list of points (x, y coordinates), colour, brush width, and a timestamp.
- **CanvasState**: Represents the complete drawing at a point in time. Contains all strokes drawn so far in the **current round**, ordered by creation time. A new CanvasState is created at the start of each round; the previous round's canvas is discarded.
- **DrawingAction**: An action performed on the canvas (add stroke, clear, undo). Used to communicate changes between drawer and server.

## Success Criteria

### Measurable Outcomes

- **SC-001**: The drawer can begin drawing within 1 second of the game round starting
- **SC-002**: Strokes appear on guessers' screens within 2 seconds of the drawer completing them
- **SC-003**: The canvas supports at least 8 colours and 3 brush widths with clear visual distinction
- **SC-004**: The clear canvas action removes all strokes for all participants within 2 seconds
- **SC-005**: A guesser joining mid-round sees the complete current drawing within 2 seconds

## Assumptions

- Drawing data is stored as stroke metadata (vectors), not as bitmap images — this allows efficient incremental updates
- A stroke is defined by discrete points sampled during mouse movement (not every pixel)
- A stroke is considered complete when the user lifts the mouse button (mouse-up event); only completed strokes are synced to the server
- The polling interval for drawing sync is separate from lobby polling and may be different
- Touch input on mobile devices is out of scope for v1 (mouse input only)
- Canvas size is fixed for all players to ensure consistent display
- The drawing canvas is a simple freehand drawing tool — no shape tools, text, or image insertion
