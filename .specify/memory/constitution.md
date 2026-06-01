# Scribble Constitution

## Core Principles

### I. TypeScript-First Development

All code MUST be written in TypeScript with full type coverage. Avoid `any` types; use `unknown` for genuinely dynamic values. Both backend (Node.js + Express) and frontend (React + Vite) enforce strict typing. This ensures compile-time safety and improves maintainability across the monolith.

### II. In-Memory State Management

Game state is stored exclusively in-memory; no persistent databases are permitted. Rooms, players, scores, and drawings exist only during active sessions. The backend uses an in-memory room store to manage game lifecycle. Sessions are lost on server restart; this is acceptable for the current product scope.

### III. HTTP Polling Architecture (No WebSockets)

All client-server synchronization uses HTTP polling; WebSockets and real-time push protocols are strictly forbidden. The frontend polls the backend at regular intervals to fetch room snapshots and game state updates. This simplifies infrastructure and aligns with the brownfield constraints.

### IV. Structured Validation with Zod

All request payloads and API responses MUST be validated using Zod schemas on the backend. Schemas are defined centrally in `src/api/schemas.ts` and enforced at route entry points. This ensures type safety at runtime and provides clear API contracts.

### V. React Hooks & Functional Components

Frontend components MUST be functional components using React hooks (`useState`, `useEffect`, etc.). Complex state is managed centrally in `src/state` (e.g., `roomStore.ts`). Avoid class components and lifecycle methods. Follow react-router-dom v6 for routing and keep component logic focused and testable.

## Technology Constraints

All development MUST adhere to the following hard requirements:

- **Backend**: Node.js 18+, Express, TypeScript, Zod for validation, `tsx` for execution.
- **Frontend**: React 18+, React Router 6+, Vite, TypeScript.
- **No WebSockets**: All real-time sync via HTTP polling only.
- **No Databases**: In-memory state only; no SQL, NoSQL, SQLite, or any persistence layer.
- **No Authentication**: No JWT, OAuth, sessions, or user accounts.
- **Immutability**: Prefer immutable data structures and pure functions wherever possible.
- **Error Handling**: Fail fast and gracefully; centralized error handlers on backend, graceful UI fallbacks on frontend.

## Code Organization & Quality

**Backend Structure** (`/backend`):

- `src/api`: Routes and request handling with Zod validation
- `src/services`: Core business logic (e.g., room management, game state)
- `src/models`: TypeScript types and entity definitions
- Keep room store minimal; explicitly clean up inactive rooms to prevent memory leaks

**Frontend Structure** (`/frontend`):

- `src/pages`: Page-level React components (Create, Join, Lobby, Game, etc.)
- `src/components`: Reusable UI components
- `src/state`: Centralized state management (e.g., `roomStore.ts`)
- `src/services`: API client logic
- `src/styles`: CSS modules or global styles
- Ensure UI handles API errors gracefully; do not crash on fetch failures

**Testing**:

- Unit tests for business logic and components
- Integration tests for API routes and state updates
- Tests MUST be meaningful and verify real behavior, not just coverage metrics

## Governance

This constitution supersedes all other development guidance. Changes to this document require explicit amendment:

1. Proposed changes MUST be documented in a pull request with rationale
2. All amendments trigger a version bump (semantic versioning: MAJOR.MINOR.PATCH)
3. Templates (`spec.md`, `plan.md`, `tasks.md`) MUST be reviewed for alignment after any amendment
4. Compliance is verified during code review; violations block merge

**Version**: 1.0.0 | **Ratified**: 2026-06-01 | **Last Amended**: 2026-06-01
