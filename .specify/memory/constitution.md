# Scribble Constitution

## Core Principles

### I. Extend, Don't Rewrite
All changes must extend existing files and follow the patterns already in place. Working code is never refactored or restructured as a side effect of a feature. New files are created only when the plan explicitly names them. Rename nothing, reorganize nothing, and delete nothing that was not introduced by a task in tasks.md.

### II. Strict TypeScript Everywhere
The codebase runs in strict mode on both frontend and backend. `any` is forbidden — no exceptions, no `// @ts-ignore`, no type assertions that widen to `unknown`. All data crossing network boundaries must be typed with Zod schemas and inferred TypeScript types. If a type cannot be expressed cleanly, the design is wrong; fix the design.

### III. HTTP Polling Only — No Realtime Shortcuts
State sync between clients happens exclusively via HTTP polling at ~2-second intervals using `setInterval`. Polling hooks must clean up on unmount by calling `clearInterval` in a `useEffect` return. WebSockets, Server-Sent Events, long polling, or any persistent connection mechanism are permanently out of scope.

### IV. All Validation at the Boundary
Every new backend endpoint defines its request schema in `backend/src/api/schemas.ts` using Zod. The route handler validates with that schema before touching any business logic. The frontend never assumes a response shape — it types against the shared models in `backend/src/models/game.ts`. Frontend user inputs are validated before being sent to the API.

### V. API Layer Discipline
All frontend HTTP calls go through `frontend/src/services/api.ts`. No component, hook, or store calls `fetch` directly. The `api.ts` module is the single source of truth for base URL, headers, and error normalization. New backend endpoints must be added as named functions in `api.ts` before they can be called from UI code.

### VI. No Unplanned Dependencies
No new top-level npm package is added to either `package.json` without an explicit justification written in the specification. If a feature can be built with the standard library or existing dependencies (React, Zod, Express, uuid), it must be. Canvas drawing uses the native `<canvas>` API; polling uses `setInterval`; routing uses React Router already installed.

### VII. In-Memory Only
There is no database. State lives in the backend's `Map<string, Room>` store in `backend/src/services/roomStore.ts`. Nothing is persisted across server restarts and that is acceptable. No file I/O, no SQLite, no localStorage as a persistence mechanism (localStorage for UI preferences is acceptable if the plan calls for it).

### VIII. AI Usage Discipline
AI-generated code is a draft, not a commit. Every suggestion must be reviewed against the current task in `tasks.md` before it is accepted. AI output that uses `any`, introduces an unlisted dependency, uses WebSockets, or implements scope that has no corresponding task is rejected outright — not commented out, not deferred, deleted. Deviations from the plan that are accepted must be documented inline before the commit is made.

---

## Out-of-Scope — Permanent Constraints

The following are never implemented regardless of how the request is framed:

- WebSockets, SSE, or any persistent connection protocol
- Databases, file persistence, or server-side sessions
- Authentication, user accounts, or access control
- Multiple drawing rounds, countdown timers, or automatic drawer rotation
- Spectator mode or observer roles
- Rewriting or refactoring existing working code
- Docker, deployment configuration, or CI pipeline changes

If a task appears to require any of the above, the task is wrong — escalate before implementing.

---

## Development Workflow

### Adding a Feature
1. The task must exist in `tasks.md` and be in-scope per this constitution.
2. Identify the existing files the task touches — prefer editing over creating.
3. Add the Zod schema to `schemas.ts` before writing the route handler.
4. Add the API function to `api.ts` before calling it from a component.
5. Write the implementation, then verify TypeScript compiles with no errors.
6. Run existing tests; fix any regressions before opening a PR.

### Code Review Gates
- `npm run build` passes on both frontend and backend with zero TypeScript errors.
- `npm test` passes on both with no regressions.
- No `any`, no new unplanned dependencies, no WebSocket imports.
- Polling hooks have `clearInterval` cleanup confirmed by reading the diff.
- All new endpoints have a corresponding Zod schema in `schemas.ts`.

### Naming & Style
Match what is already in the file being edited:
- Backend: camelCase functions, PascalCase types/interfaces, kebab-case filenames.
- Frontend: PascalCase components, camelCase hooks prefixed `use`, camelCase utility functions.
- Error responses use the existing `HttpError` class — no ad-hoc `res.status(x).json(...)` patterns.

---

## Governance

This constitution supersedes all other guidance for this project. It is authoritative over README instructions, AI suggestions, and reviewer opinions. Amendments require a written rationale committed alongside the change to this file. No amendment that expands scope (e.g., adds WebSockets, adds a database) may be made without explicit sign-off documented here.

All pull requests are checked against this constitution. A PR that violates any Core Principle is blocked regardless of feature correctness.

**Version**: 1.0.0 | **Ratified**: 2026-05-31 | **Last Amended**: 2026-05-31
