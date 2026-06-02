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

## Active Technologies
- TypeScript 5.x (backend + frontend) + Backend: Express 4, Zod 3, cors. Frontend: React 18, React Router 6, Vite 5. (001-room-setup-lobby)
- In-memory only (no database — per constitution) (001-room-setup-lobby)
- Canvas sync via HTTP polling (1s interval), room state via HTTP polling (2s interval). HTML5 Canvas API for drawing (no canvas library). (003-gameplay-interaction)

## Recent Changes
- 001-room-setup-lobby: Added TypeScript 5.x (backend + frontend) + Backend: Express 4, Zod 3, cors. Frontend: React 18, React Router 6, Vite 5.
- 002-game-start-drawer-flow: Name trimming via Zod .trim(), drawer assignment on game start (host=drawer), deterministic secret word selection and per-participant filtering.
- 003-gameplay-interaction: Canvas drawing (drawer) with HTTP polling sync at 1s; guess submission/scoring with exact case-insensitive match (100 pts per correct guess, max 100 chars); guess history visible to all; auto-redirect lobby→game on status change.
