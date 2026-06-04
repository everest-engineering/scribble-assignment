<!--
SYNC IMPACT REPORT:
- Version change: none -> 1.0.0 (Initial Ratification)
- List of modified principles:
  - [PRINCIPLE_1_NAME] -> I. TypeScript-First and Strict Type Safety
  - [PRINCIPLE_2_NAME] -> II. Standard Relative and Absolute ES Module Imports
  - [PRINCIPLE_3_NAME] -> III. In-Memory Ephemeral Data Only (NON-NEGOTIABLE)
  - [PRINCIPLE_4_NAME] -> IV. HTTP Polling Sync Only (NON-NEGOTIABLE)
  - [PRINCIPLE_5_NAME] -> V. Fail Fast and Graceful Error Handling
- Added sections:
  - Frontend Implementation Constraints
  - Development & Implementation Workflow
- Templates requiring updates:
  - plan-template.md (✅ updated)
  - spec-template.md (✅ updated)
  - tasks-template.md (✅ updated)
- Follow-up TODOs: None
-->

# Scribble Game Constitution

## Core Principles

### I. TypeScript-First and Strict Type Safety
Every piece of new code and refactors MUST be fully typed in both the frontend and backend.
Avoid `any` at all costs; use `unknown` if a type is truly dynamic. All data models, requests,
and responses must use precise interfaces.

### II. Standard Relative and Absolute ES Module Imports
Both environments strictly use TypeScript and ES Modules. Use standard relative and absolute
ES module imports. In the backend, file extensions are omitted or handled via `.js` standard.

### III. In-Memory Ephemeral Data Only (NON-NEGOTIABLE)
The project strictly forbids the use of databases (SQL, NoSQL, SQLite, etc.). All game data
is stored in-memory only (using variables and Maps). Restarting the backend clears all rooms.

### IV. HTTP Polling Sync Only (NON-NEGOTIABLE)
Do not use WebSockets, Socket.io, or any real-time push protocol. All synchronization and
communication between frontend and backend must use HTTP polling.

### V. Fail Fast and Graceful Error Handling
Use Zod for all request payload and response validations. Fail fast and gracefully. On the
backend, use centralized error handlers. On the frontend, ensure the UI does not crash on
API exceptions.

## Frontend Implementation Constraints
- React 18 functional components and strict hooks (e.g., `useState`, `useEffect`) must be used.
- Component routing must utilize `react-router-dom` v6 paradigms.
- Complex state must reside in `src/state` following the established patterns in `roomStore.ts`.
- Styling must use vanilla CSS residing in `app.css` or CSS modules. No TailwindCSS or external UI
  libraries are allowed.
- Authentication, sessions, JWT, or OAuth are strictly forbidden.

## Development & Implementation Workflow
- Follow a phased approach for feature execution: Discovery, Specify, Clarify, Plan, Tasks,
  Implement, and Validate.
- Complete work incrementally, keeping commits granular and meaningful.
- Do not implement any out-of-scope features (e.g., drawer rotation, custom word packs, room
  passwords).
- Ensure both frontend and backend build successfully before handing off changes:
  - Backend: `npm run build`
  - Frontend: `npm run build`

## Governance
- The constitution is the source of truth for engineering practices and game constraints.
- Amendments to this constitution require a semantic version bump and verification of dependency template alignment.
- Every implementation plan and spec iteration must be verified against this constitution to ensure compliance.

**Version**: 1.0.0 | **Ratified**: 2026-06-04 | **Last Amended**: 2026-06-04
