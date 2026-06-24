# Scribble Lab Constitution

Engineering principles and AI-assisted development rules for the Scribble brownfield enhancement lab.

## Engineering Principles

1. **Extend, don't rewrite** — build on the starter's existing structure (Express routes, React pages, roomStore pattern). Do not replace working scaffolding.
2. **TypeScript first** — all new code is fully typed. Use Zod for backend validation. Avoid `any`.
3. **Immutability** — prefer pure functions and immutable updates in the room store. Clone rooms on read/write.
4. **Fail fast** — validate inputs at the API boundary. Return clear HTTP error messages. Never silently coerce invalid data.
5. **Minimal memory footprint** — rooms live in a Map; no database. Keep room objects lean; remove inactive rooms when appropriate.
6. **Polling-only sync** — all multi-player synchronization uses HTTP polling (~2s). No WebSockets, Socket.io, or push protocols.
7. **Deterministic game rules** — word selection, scoring, and role assignment must produce the same result given the same room state. No randomness that diverges across polls.
8. **Viewer-specific responses** — `GET /rooms/:code` returns different fields based on `participantId` query param (e.g. secret word visible only to drawer).

## Out of Scope (Do Not Build)

- WebSockets, databases, authentication, deployment/CI/Docker
- Multiple rounds, drawer rotation, timers, custom word packs
- Spectator mode, moderation, room passwords
- New state-management or routing libraries
- Unjustified top-level dependencies or unrelated refactors

## AI Usage Rules

1. **Spec before code** — every feature group gets updated spec, plan, and tasks artifacts before implementation begins.
2. **One scenario at a time** — complete specify → plan → tasks → implement → validate for each phase before moving to the next.
3. **Review all AI output** — read every generated diff. Verify it matches the spec and does not introduce out-of-scope dependencies.
4. **Granular commits** — each commit maps to a single logical change (one artifact set, one backend slice, one frontend slice). Commit messages describe the "why".
5. **No AI attribution in commits** — commit messages are professional and describe the change, not the tool used to produce it.
6. **Validate with two browser tabs** — every phase must be manually verified with two tabs simulating two players before committing.

## Review Discipline

Before each commit:

- [ ] Code matches the current spec's acceptance criteria
- [ ] No forbidden technologies (WebSockets, DB, auth) in code or dependencies
- [ ] Backend and frontend build successfully (`npm run build`)
- [ ] Existing tests pass (`npm test`)
- [ ] No unrelated changes or drive-by refactors
- [ ] Types are consistent between backend model and frontend API types

## Testing Expectations

- Extend existing Vitest tests for new backend logic (roomStore, schemas)
- Extend frontend API tests for new endpoints
- Manual two-tab validation for each scenario
- Run pre-evaluation check before opening PR

## File Conventions

- Backend: `src/api/` (routes), `src/services/` (logic), `src/models/` (types)
- Frontend: `src/pages/` (screens), `src/components/` (UI), `src/state/` (store), `src/services/` (API)
- Artifacts: `.specify/memory/constitution.md`, `specs/NNN-feature-name/{spec,plan,tasks}.md`
- Discovery: `docs/discovery.md`
- Reflection: `reflection.md` at repo root
