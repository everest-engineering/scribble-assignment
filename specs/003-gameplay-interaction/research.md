# Research: Gameplay Interaction

## Decisions Made

### 1. Drawing Canvas for Drawer
- **Decision**: Use a standard HTML5 `<canvas>` element in React using `useRef` to get the canvas node, and track local mouse/touch drawing state in the component.
- **Rationale**: Local rendering of canvas lines meets the requirement of "Drawing visible on drawer screen" and "Interactive drawing canvas for drawer" without violating the "no WebSockets" constraint (drawing synchronization is out of scope for guessers).
- **Alternatives considered**: Using a third-party drawing library. Rejected because a vanilla canvas context (using `lineTo` and `stroke`) is lightweight, has zero external dependencies, and satisfies all requirements.

### 2. Clear Canvas Action
- **Decision**: Provide a "Clear Canvas" button below the drawer's canvas. When clicked, it obtains the canvas 2D context and calls `context.clearRect(0, 0, canvas.width, canvas.height)`.
- **Rationale**: Clean, direct, and doesn't require any backend communication.

### 3. Guess Submission Endpoint
- **Decision**: Expose a new API endpoint: `POST /api/rooms/:code/guesses` (or `/rooms/:code/guesses`).
- **Request Body**:
  ```json
  {
    "participantId": "string",
    "guessText": "string"
  }
  ```
- **Response**: The updated `RoomSnapshot`.
- **Rationale**: Validated with Zod at the backend boundary. Validates that the participant is not the drawer, matches case-insensitively, and computes points.

### 4. Score Tracking & Persistence
- **Decision**: Add a `score` integer attribute directly to the `Participant` interface on the backend. When a correct guess is evaluated, increment that participant's score by 100 points.
- **Rationale**: Simple in-memory persistence that keeps scores associated with participants for the duration of the room session.

### 5. Guess Evaluation and Scoring Rules
- **Decision**:
  - Compare guess case-insensitively (e.g. `guess.trim().toLowerCase() === secretWord.toLowerCase()`).
  - To enforce "award points only once per round", search `guessHistory` to see if the participant already has a correct guess. If not, award 100 points.
  - Reject guess submission if the player is the drawer.
- **Rationale**: Simple lookup inside `guessHistory` is extremely robust and does not require complex state flags.

### 6. Synchronizing State
- **Decision**: Synchronize both the updated participant list (with scores) and the guess history via the existing 2-second HTTP polling mechanism that is already active on the game page.
- **Rationale**: Reuses existing polling infrastructure without introducing new complexity or prohibited push protocols.
