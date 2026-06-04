# Research: Round End and Game Restart

## Decision 1: Frontend Results View (Modal)
- **Decision**: Implement the round results as a **Modal** component with vertical stack layout.
- **Rationale**: Provides a focused view that clearly separates the end-of-round state.
- **Layout Details**:
  - Header: "Round Ended" title.
  - Center-Top: Prominent revealed word.
  - Center-Middle: Scrollable Final Scores (max-height: 200px).
  - Center-Bottom: Scrollable Guess History (max-height: 200px).
  - Footer: "Restart Game" (Host) or Status Message.
- **Styling**: MUST strictly follow the existing UI's `panel`, `card`, and `button` CSS variables/classes.

## Decision 2: Host Action - End Round
- **Decision**: Render an "End Round" button inside the `.button-row` beside the "Exit Game" button for the host.
- **Rationale**: High visibility for host management. Styled as `button--secondary`.

## Decision 3: Conflict Resolution & Churn
- **Decision**: **Latest request wins** (First to Server). Subsequent conflicting requests receive 400s.
- **Churn Decision**: Players leaving mid-round **do not** trigger automatic end recalculation. Host MUST end manually if the round becomes stuck due to churn.

## Decision 4: Error Handling
- **Decision**: Show **non-blocking toasts** exclusively to the host if `/end` or `/restart` API calls fail.
- **Rationale**: Keeps the host informed without breaking the UI for guessers.

## Decision 5: Device Scope
- **Decision**: **Desktop web only**. Mobile and tablet responsive layouts are out of scope. Accessibility (ARIA/Focus Trap) is also out of scope per user direction.
