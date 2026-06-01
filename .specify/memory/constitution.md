# Scribble Lab Constitution

## Engineering principles

1. **Brownfield first** — extend the starter’s Express + React structure; do not replace routing, build tooling, or in-memory storage patterns without justification.
2. **Spec before code** — every behavioral change traces to a feature-group spec with acceptance criteria; deviations are documented in the plan or reflection.
3. **Polling-only sync** — all multi-player updates use HTTP polling (~2s in lobby and active game). No WebSockets, SSE, or push libraries.
4. **Determinism where graded** — secret word selection and scoring rules are predictable and testable (same room code → same word index formula; correct guess → +100).
5. **Minimal dependencies** — no new top-level packages unless the spec requires them; prefer canvas APIs and existing Zod validation.
6. **Viewer-specific API responses** — the server filters secrets (word) per `participantId`; the client does not “hide” sensitive data that was already leaked in JSON.

## AI usage rules

- Use AI for discovery, drafting specs/plans/tasks, and incremental implementation slices aligned to one scenario at a time.
- Always read the touched files before editing; never assume the starter matches the lab PDF if the repo differs (e.g. `.specify/` layout vs `/speckit.*` paths).
- Reject AI suggestions that add out-of-scope features (multi-round, auth, DB, timers, drawer rotation).
- After each slice, run `npm test` and `npm run build` in `backend/` and `frontend/` before claiming completion.
- Human review is mandatory before opening the PR: another agent or peer checks spec ↔ code alignment.

## Review discipline

- Self-review against the four business scenarios with two browser tabs before submit.
- Commits are small and message-linked to a task (e.g. `feat(lobby): add host-only start with polling`).
- PR description includes Everest email, role checkbox, and summary of all four scenarios in one PR.
- CI pre-evaluation (constitution, four `specs/NNN-*` folders, reflection, forbidden-tech scan, build/test) must pass on the fork before requesting review on the upstream repo.

## Coding standards

- TypeScript strict typing; no `any`.
- Zod validates all request bodies and params on the backend.
- Errors return `{ message: string }` with appropriate HTTP status (400 validation, 403 forbidden, 404 not found).
- React: functional components, hooks for polling with cleanup on unmount.
- Tests cover room store rules (host, validation, scoring, word selection) and critical API schemas.

## Testing expectations

- Unit tests in `backend/src/services/roomStore.test.ts` for domain logic.
- Existing frontend API tests updated when endpoints change.
- Manual two-tab validation per scenario before merging feature groups.
