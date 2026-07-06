# Copilot Agent Instructions

## Project Context
You are working on a monolithic repository for a multiplayer drawing game ("Scribble") containing an Express backend and a React frontend. Both environments strictly use TypeScript and ES Modules.

## Tech Stack
-   **Backend**: Node.js, Express, TypeScript, Zod, `tsx` for execution.
-   **Frontend**: React (v18), React Router (v6), Vite, TypeScript.

## General Coding Guidelines
-   **TypeScript First**: Ensure all new code and refactors are fully typed. Avoid `any`; use `unknown` if a type is truly dynamic.
-   **Imports**: Use standard relative and absolute ES module imports. In the backend, file extensions are omitted or handled via `.js` standard if necessary.
-   **Immutability**: Prefer immutable data structures. Use pure functions where possible.
-   **Error Handling**: Fail fast and gracefully. On the backend, use centralized error handlers. On the frontend, ensure UI does not crash on API exceptions.

## Backend Guidelines (`/backend`)
-   **Validation**: Use `Zod` for all request payload and response validations.
-   **Structure**:
    -   `src/api`: Routes and request handling.
    -   `src/services`: Core business logic (e.g., Room management).
    -   `src/models`: Data types and entity representations.
-   **No Stateful Bloat**: Keep the memory footprint for active game rooms minimal and explicitly remove inactive rooms.

## Frontend Guidelines (`/frontend`)
-   **React Patterns**: Use functional components and strict hooks (`useState`, `useEffect`, etc.).
-   **Routing**: Use `react-router-dom` v6 paradigms.
-   **State Management**: Complex state is held in `src/state` (e.g., via Zustand or Context API). Follow the established pattern in `roomStore.ts`.
-   **Styling**: Classes should reside in `app.css` or CSS modules. Keep components structurally clean.

## Commands
-   **Backend Dev**: `cd backend && npm run dev`
-   **Frontend Dev**: `cd frontend && npm run dev`

## Strictly Forbidden
-   **No WebSockets**: Do not use WebSockets, Socket.io, or any real-time push protocol. All sync must use HTTP polling.
-   **No Databases**: Do not use any database (SQL, NoSQL, SQLite, etc.). All data is stored in-memory only.
-   **No Authentication**: Do not add authentication, sessions, JWT, or OAuth.

## Agent Persona
-   Give concise, direct answers.
-   Do not output large blocks of code if a small change suffices.
-   When creating or editing files, ensure consistency with the existing directory structure detailed above.

<!-- SPECKIT START -->
Feature 001 (complete): Host tracking on room creation. The creator is
automatically designated as host (stored via hostId on Room + isHost on
Participant). A "Host" label is displayed next to the host's name on all
screens. See the full plan at:
specs/001-host-tracking/plan.md

Feature 002 (complete): Join validation with clear error messages.
Invalid/empty room codes are rejected with clear feedback. See the plan at:
specs/002-join-validation/plan.md
and the spec at: specs/002-join-validation/spec.md

Feature 003 (complete): Multi-room isolation. Each room has its own
independent state in the in-memory Map and participants/state never leak
between rooms. Verified with dedicated isolation tests.

Feature 004 (complete): Automatic lobby polling. The Lobby page
auto-polls room state every ~2s so players see new joiners without manual
refresh. Auto-navigates to game page on status change and to home on 404.
See the plan at:
specs/004-lobby-polling/plan.md
and the spec at: specs/004-lobby-polling/spec.md

Feature 005 (complete): Host start control. Only the host can see
and use the "Start Game" button. Button is disabled until at least 2
players are in the room. See the plan at:
specs/005-host-start-control/plan.md
and the spec at: specs/005-host-start-control/spec.md

Feature 006 (in progress): Game start and drawer flow. Player name
validation (trim, reject empty). Game start endpoint transitions room
to drawing status, assigns host as round-1 drawer, selects secret word
deterministically via (round-1) % words.length. Word visible only to
drawer. See the plan at:
specs/006-game-start-drawer-flow/plan.md
and the spec at: specs/006-game-start-drawer-flow/spec.md
<!-- SPECKIT END -->
