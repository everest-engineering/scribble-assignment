# Discovery Notes

## Objective
Enhance the starter Scribble assignment as a brownfield project by documenting the current system, defining implementation constraints, and incrementally delivering the four required scenarios.

## Starter behavior already confirmed
- Frontend application shell and navigation flows exist.
- Create Room works on the happy path and navigates the creator into a lobby.
- Join Room works on the happy path for an existing room code.
- Lobby displays room code and participant list.
- Manual room refresh exists in the lobby.
- Backend exposes minimal in-memory room APIs: `POST /rooms`, `POST /rooms/:code/join`, and `GET /rooms/:code`.
- Branding and game-themed layout already exist, but actual gameplay is mostly placeholder.

## Incomplete or missing behaviors
1. Host tracking is missing. There is no owner/host concept in the current room model.
2. Join validation is incomplete. Invalid room codes and invalid names do not produce strong user feedback.
3. Player name validation is incomplete. Empty names silently become `Player`, which violates the required scenario.
4. Lobby synchronization is incomplete. Only manual refresh exists; auto-polling is required.
5. Start game flow is missing. There is no backend endpoint or guarded UI action to start a game.
6. Role assignment is missing. Drawer/guesser roles exist as data but are not used.
7. Secret word handling is missing. The word list exists but is never assigned to a round.
8. Viewer-specific room responses are missing. Every client sees the same room data regardless of role.
9. Canvas interaction is missing. The game screen contains a placeholder surface only.
10. Guess submission is missing. The input renders but does not affect state.
11. Guess history synchronization is missing.
12. Scoring is missing.
13. Result state is missing.
14. Restart flow is missing.

## Assumptions
1. Identity can remain lightweight and in-memory. A player can be represented by a generated participant id returned from the backend without introducing authentication.
2. Polling every ~2 seconds is acceptable for both lobby and gameplay synchronization because WebSockets are explicitly out of scope.
3. Only one round is required per game session. Restart returns the room to lobby instead of starting another round automatically.
4. Deterministic word selection can be implemented by using a stable rule such as the first word in the starter list or a predictable index based on room creation order, as long as it is documented and testable.
5. The host is the creator of the room; if the spec needs a fallback, the first participant in the room is treated as host-compatible for drawer assignment.
6. Two-browser or two-tab manual testing is sufficient for acceptance validation unless the starter already contains automated tests that can be extended cheaply.

## Relevant files to inspect

### Backend
- `backend/src/index.*` or equivalent server bootstrap file.
- `backend/src/routes/**` for room endpoints.
- `backend/src/store/**` or equivalent in-memory room storage.
- `backend/src/types/**` or shared room/game interfaces if present.
- `backend/package.json` for scripts and dependency boundaries.

### Frontend
- `frontend/src/main.*` and app/router bootstrap.
- `frontend/src/App.*` and route definitions.
- `frontend/src/pages/Landing*`
- `frontend/src/pages/CreateRoom*`
- `frontend/src/pages/JoinRoom*`
- `frontend/src/pages/Lobby*`
- `frontend/src/pages/Game*`
- `frontend/src/components/**` for forms, scoreboard, canvas placeholders, and shared UI.
- `frontend/src/api/**` or service helpers for backend communication.
- `frontend/src/types/**` or shared client-side room/game contracts.
- `frontend/package.json` for scripts and dependency boundaries.

## Risks and implementation watchouts
- Polling can create race conditions if local optimistic state conflicts with backend truth; backend should remain source of truth.
- Viewer-specific response logic must avoid leaking the secret word to guessers.
- Restart must preserve participants while clearing round-specific state only.
- Brownfield work should avoid replacing routing or state libraries unless absolutely necessary and justified.

## Scenario-to-feature map

| Scenario | Core deliverables |
|---|---|
| Scenario 1 | Host tracking, join validation, room isolation, lobby polling, host-only start with 2-player minimum |
| Scenario 2 | Trimmed player names, empty-name rejection, drawer assignment, deterministic word selection, drawer-only word visibility |
| Scenario 3 | Drawing canvas, clear action, guess validation, synced guess history, deterministic scoring |
| Scenario 4 | Result state, final word/scores/history visibility, host restart, room reset to lobby with players preserved |

## Validation approach
- Run backend and frontend from a clean clone.
- Use two tabs or browsers to verify synchronization and role-specific behavior.
- Validate each scenario independently before moving to the next.
- Keep commits granular so every artifact and implementation step can be traced in review.