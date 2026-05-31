# Task Checklist: Game Start & Drawer Flow

This document tracks the tasks required to implement and verify the Game Start & Drawer Flow feature.

## Tasks

### Backend Tasks
- [x] **Task 2.1**: Implement the `POST /rooms/:code/start` route. Enforce host authorization check and minimum participant threshold of 2.
- [x] **Task 2.2**: Assign the room host as the drawer and pick a secret word deterministically from the starter word list.
- [x] **Task 2.3**: Update snapshot mapping (`toRoomSnapshot()`) to hide the secret word unless the requesting user is the drawer.

### Frontend Tasks
- [x] **Task 2.4**: Connect the "Start Game" button in the Lobby Page to trigger the API start command.
- [x] **Task 2.5**: Implement role-based layouts on the Game Page, separating drawing privileges and word visibility between the drawer and guesser.

### Verification Tasks
- [x] **Task 2.6**: Run manual verification to ensure that the secret word is only visible to the drawer and that only the host can start.
