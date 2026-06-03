<!--
Sync Impact Report:
- Version change: None -> 1.0.0
- List of modified principles:
  - [PRINCIPLE_1_NAME] -> I. TypeScript First & Strict Styling (Engineering Principle)
  - [PRINCIPLE_2_NAME] -> II. Minimal In-Memory & Polling Architecture (Engineering Principle)
  - [PRINCIPLE_3_NAME] -> III. Extend, Don't Replace (Process Principle)
  - [PRINCIPLE_4_NAME] -> IV. Strict Scope Guardrails (Process Principle)
  - [PRINCIPLE_5_NAME] -> V. AI & Review Discipline (Process Principle)
- Added sections:
  - Scope & Boundaries (replacing [SECTION_2_NAME])
  - Development & Review Discipline (replacing [SECTION_3_NAME])
- Templates requiring updates:
  - .specify/templates/tasks-template.md (✅ updated)
- Follow-up TODOs: None
-->

# Scribble Constitution

## Core Principles

### I. TypeScript First & Strict Styling (Engineering Principle)
All new code and refactorings MUST be fully typed in TypeScript. Avoid `any` and use `unknown` only if a type is truly dynamic. Standard relative and absolute ES module imports MUST be utilized (backend file extensions omitted or `.js` standard if necessary). All styling classes MUST reside in `app.css` or CSS modules to keep component structures clean. Functional components and strict React hooks (e.g., `useState`, `useEffect`) MUST be used alongside `react-router-dom` v6 paradigms. State management MUST follow the established patterns (e.g., Zustand or Context API) in `roomStore.ts`.

### II. Minimal In-Memory & Polling Architecture (Engineering Principle)
The backend MUST store all room and gameplay state in-memory only. No databases (SQL, NoSQL, SQLite, etc.) are allowed. The memory footprint for active game rooms MUST be minimized, and inactive rooms must be explicitly removed. No WebSockets, Socket.io, or real-time push protocols are permitted; all client-server state synchronization MUST utilize HTTP polling.

### III. Extend, Don't Replace (Process Principle)
Do NOT rewrite the starter code from scratch. Extend the existing scaffold interfaces and logic rather than replacing them. Maintain the monolithic directory structure: backend code belongs in `/backend/src/` (organized under `api`, `services`, and `models`), and frontend code belongs in `/frontend/src/`. Maintain documentation integrity: all existing comments and docstrings MUST be preserved unless explicitly specified.

### IV. Strict Scope Guardrails (Process Principle)
Any feature or technical element defined as out of scope MUST NOT be specified, planned, or implemented. This covers WebSockets, databases, authentication/sessions, deployment pipelines, containerization, custom state management libraries, multiple rounds, drawer rotation, timers, custom word packs, spectator mode, moderation, room passwords, and invite links. Top-level dependencies MUST NOT be added unless strictly justified by the specification. Refactoring unrelated code is prohibited.

### V. AI & Review Discipline (Process Principle)
All AI-generated code MUST be critically reviewed before staging and committing. Commits MUST be kept granular, sequential, and meaningful to preserve traceablity. Refactoring should be concise; avoid outputting or committing large blocks of code when a small change suffices. The system MUST fail fast and gracefully: use centralized error handlers on the backend, and ensure the frontend UI does not crash or freeze on API exceptions.

## Scope & Boundaries

### Out of Scope Technical Elements
- WebSockets and real-time push protocols (e.g., Socket.io)
- Databases and persistent storage (SQL, NoSQL, SQLite, Redis, etc.)
- Authentication, accounts, sessions, JWT, or OAuth
- Deployment, hosting, CI/CD pipelines, or Docker containerization
- New state-management or routing libraries beyond what the starter ships (React Router 6, Zustand)

### Out of Scope Gameplay Features
- Multiple rounds, drawer rotation, or spectator mode
- Round timers and countdowns
- Speed or drawer score bonuses
- Custom or random word packs
- Room moderation features (kick / mute)
- Room passwords or invite links

### Out of Scope Process Elements
- Rewriting the starter from scratch — extend, do not replace
- Adding top-level dependencies not justified by the spec
- Refactoring unrelated code

## Development & Review Discipline

### Code Review and Gates
- Every code change must be validated against the out-of-scope boundaries defined in this Constitution.
- Frontend and backend builds must build cleanly (`npm run build` in both directories) without TypeScript or lint warnings before completion.

### Verification Guidelines
- Verify multi-player interactions using at least two independent browser tabs.
- Ensure all input values are properly trimmed and validated on both the frontend and backend.

## Governance
This Constitution is the ultimate authority governing the scope and design rules of the Scribble project. Any proposed deviation or scope adjustment requires documentation, consensus, and an incremental version bump of this document.

**Version**: 1.0.0 | **Ratified**: 2026-06-02 | **Last Amended**: 2026-06-02
