# Scribble Lab Constitution

## Engineering Principles

1. **Extend, don't replace** — Build on the starter scaffold. Reuse existing patterns in `roomStore`, `api.ts`, and page components rather than rewriting from scratch.
2. **TypeScript first** — All new code is fully typed. Avoid `any`; use `unknown` only when truly dynamic.
3. **Zod validation** — Every request payload is validated on the backend with clear error messages. Frontend mirrors validation for immediate feedback.
4. **HTTP polling only** — All multiplayer sync uses `GET /rooms/:code` polling (~2s). No WebSockets, Socket.io, or push protocols.
5. **In-memory state** — Rooms live in a server-side `Map`. No databases, files, or persistent storage.
6. **Immutability** — Prefer pure functions and `structuredClone` for room snapshots. Mutate room state only through service functions.
7. **Deterministic game rules** — Word selection uses a hash of the room code. Scoring is fixed: 100 for correct, 0 for incorrect. No randomness in game outcomes beyond room code generation.
8. **Minimal dependencies** — Do not add top-level packages unless the spec justifies them. Use native HTML canvas for drawing.

## AI Usage Rules

1. **Spec before code** — Update `specs/NNN-*/spec.md`, `plan.md`, and `tasks.md` before implementing each feature group.
2. **Review AI output** — Read every generated change for correctness, scope creep, and alignment with acceptance criteria before committing.
3. **No out-of-scope features** — Do not implement WebSockets, databases, auth, timers, multiple rounds, drawer rotation, or unrelated refactors.
4. **Trace commits to tasks** — Each commit should map to a task in `tasks.md`. Use granular, meaningful commit messages.
5. **Document deviations** — If implementation differs from spec, note the reason in the spec file or reflection report.

## Review Discipline

1. **Two-browser validation** — Test each scenario with two browser tabs (host + guest) before marking a phase complete.
2. **Build verification** — Run `npm run build` in both `backend/` and `frontend/` before submission.
3. **Precheck script** — Run `node .github/scripts/pre-evaluation-check.mjs` locally to verify artifact inventory and forbidden technology scan.
4. **Edge cases** — Verify empty/whitespace names, invalid room codes, case-insensitive guesses, and multi-room isolation.
5. **Viewer-aware snapshots** — Confirm secret word is never leaked to guessers during `playing` state.

## Artifact Mapping

README references `/speckit.*` paths. CI pre-evaluation expects:
- Constitution: `.specify/memory/constitution.md`
- Feature specs: `specs/NNN-<name>/spec.md`, `plan.md`, `tasks.md`
- Reflection: `reflection.md` at repo root

## Testing Expectations

- Extend existing Vitest unit tests for `roomStore` and Zod schemas.
- Manual two-browser E2E is the primary integration test.
- No new test frameworks or heavy mocking libraries.
