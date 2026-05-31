# Implementation Plan: Result, Restart & Final Validation

**Branch**: `004-result-restart-validation` | **Date**: 2026-05-31 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-result-restart-validation/spec.md`

## Summary
Implement round termination, result presentation (secret word reveal, winner highlight, final scoreboard, guess history), and host-initiated game restarts. This is done by adding a `"result"` room status, tracking the `correctGuesserId`, and registering a new `POST /rooms/:code/restart` endpoint with strict host checks. Polling is maintained during the result state so players can auto-redirect back to the lobby when the host restarts.

## Technical Context

**Language/Version**: TypeScript ES Modules (Node.js backend, Vite React frontend)

**Primary Dependencies**: React (v18), React Router (v6), Express, Zod, Vitest

**Storage**: In-memory Map inside backend (`roomStore.ts`). No databases.

**Testing**: Vitest (`npm test` in backend and frontend)

**Target Platform**: Node.js v18+, Modern Web Browsers

**Project Type**: Monorepo Web Application

**Performance Goals**: State updates sync across all players in under 2 seconds (based on HTTP polling interval).

**Constraints**: Banned: WebSockets, databases, authentication, session tokens, timers, multiple rounds, drawer rotation.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **HTTP polling only**: Confirmed. All client sync uses the existing 2-second REST polling mechanism. Polling is maintained during the `result` status and stops/redirects once status returns to `lobby`.
- **In-memory room state only**: Confirmed. State is kept in-memory in the Express backend process. Restart resets all values in-memory without persistent logs or database entries.
- **TypeScript and Zod contracts**: Confirmed. Added new Zod validation schemas for `/restart` and updated the room schemas for `status` and `correctGuesserId`.
- **Scenario traceability**: Traceable to Scenario 4 ("Result, Restart & Final Validation") in the project README.
- **Incremental review**: Verifiable using frontend and backend unit tests in Vitest and two-browser manual verification.

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart-validation/
├── plan.md              # This file
├── research.md          # Design decisions and alternatives
├── data-model.md        # Extended entities and state transition details
├── quickstart.md        # Step-by-step manual validation instructions
└── contracts/
    └── result-restart.md # API endpoints, schemas, and HTTP error codes
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts       # Update Room and RoomSnapshot types
│   ├── services/
│   │   └── roomStore.ts  # Transition to result, implement restartRoom
│   └── api/
│       ├── schemas.ts    # Update Zod schemas (result status, error codes)
│       └── rooms.ts      # Add POST /rooms/:code/restart route
└── src/services/roomStore.test.ts # Add tests for result state and restart

frontend/
├── src/
│   ├── pages/
│   │   └── GamePage.tsx  # Render result view conditionally, handle lobby redirect
│   ├── services/
│   │   └── api.ts        # Add restartRoom API call, update types
│   └── state/
│       └── roomStore.ts  # Add restartRoom action
└── src/state/roomStore.test.ts # Add tests for restart states
```

**Structure Decision**: Web application monorepo structure. Updates will be cleanly isolated within backend services/routes, frontend API/store modules, and conditional page layouts.

## Complexity Tracking

*No constitution violations.*
