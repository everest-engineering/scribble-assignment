# Task Checklist: Gameplay Interaction

This document tracks the tasks required to implement and verify the Gameplay Interaction features.

## Tasks

### Backend Tasks
- [x] **Task 3.1**: Implement the `POST /rooms/:code/drawing` endpoint to store serialized drawing points.
- [x] **Task 3.2**: Implement the `POST /rooms/:code/guess` endpoint. Add validations, trim entries, compare case-insensitively, award points, and set status to `"result"` if correct.

### Frontend Tasks
- [x] **Task 3.3**: Build the interactive drawing canvas for the drawer and the read-only drawing canvas for guessers.
- [x] **Task 3.4**: Connect the canvas polling to redraw coordinates on guesser screens.
- [x] **Task 3.5**: Render the guess logs sidebar and hook up the guess form submission action.

### Verification Tasks
- [x] **Task 3.6**: Verify multiplayer stroke sync, case-insensitive scoring, and result transition.
