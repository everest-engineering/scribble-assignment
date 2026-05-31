# Task Checklist: Result, Restart & Final Validation

This document tracks the tasks required to implement and verify the post-game Results page and Reset loop features.

## Tasks

### Backend Tasks
- [x] **Task 4.1**: Implement the `POST /rooms/:code/restart` endpoint. Restrict execution to host, reset status to `"lobby"`, clear drawings/guesses, and reset scores to 0.

### Frontend Tasks
- [x] **Task 4.2**: Design and implement the Results view showing scores, guess history, and secret word.
- [x] **Task 4.3**: Implement the "Return to Lobby" button visible only to the host, triggering the restart API call.
- [x] **Task 4.4**: Listen to status changes in the poll loop to redirect clients from the results screen back to the lobby.

### Verification Tasks
- [x] **Task 4.5**: Run final end-to-end tests across two browsers. Verify build tasks compile without error.
