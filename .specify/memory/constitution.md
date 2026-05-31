# Constitution

## Engineering Principles

- **Brownfield**: Extend existing code, don't rewrite. Preserve patterns (Express routes, RoomStore, Zod).
- **Deterministic**: Word selection and drawer assignment must be reproducible, not random.
- **Fail fast**: Validate inputs early, return clear errors (400/404/500).
- **Minimal deps**: No new npm packages. Use HTML5 Canvas, not a drawing library.

## AI Usage

- Review all AI-generated code before committing.
- AI must not invent endpoints or behaviors not in the spec.
- AI must read existing files before suggesting changes.
- Every change must trace to an acceptance criterion.

## Review Discipline

- Run tests after every implementation phase.
- One commit per logical change with scenario reference.
- Manually verify with two browser tabs.
- Do not proceed until current scenario passes.

## Testing

- Backend: unit test store functions (create, join, host, scoring, restart).
- Frontend: test API service methods for correct requests.
- Manual E2E: two tabs across all four scenarios.

## Style

- No `any` — use `unknown` and narrow.
- No comments in code unless the "why" is non-obvious.
- Backend: `.js` extension in relative imports. Frontend: extensionless.

## Scope Boundaries

### Do Not Build
- WebSockets or real-time sync
- Databases or persistent storage
- Authentication, accounts, or sessions
- Deployment, Docker, or CI
- New state-management or routing libraries
- Multiple rounds, drawer rotation, timers
- Custom word packs or spectator mode

### Do Not Refactor
- Existing components unrelated to required changes.
- Styling or CSS not directly related to new functionality.
