# Scribble Lab Constitution

## Engineering Principles

1. **Brownfield first** — Extend the starter's patterns (Express routes, Zod validation, custom RoomStore with `useSyncExternalStore`). Do not rewrite or replace working scaffolding.
2. **HTTP polling only** — All multiplayer sync uses periodic `GET /rooms/:code` requests (~2s). No WebSockets, Socket.io, or push protocols.
3. **In-memory state** — All room data lives in the backend `Map`. No databases, files, or external persistence.
4. **Deterministic game rules** — Word selection, scoring (+100 correct, 0 incorrect), and role assignment must produce the same outcome for the same inputs. Document the algorithm in spec and plan.
5. **Fail fast with clear errors** — Invalid inputs return 400 with human-readable messages. Unknown rooms return 404. Unauthorized actions (non-host start, drawer guessing) return 403.
6. **TypeScript strictness** — No `any`. Shared concepts typed in backend models and mirrored in frontend API types.

## AI Usage Rules

1. **Spec before code** — Each feature group gets spec → plan → tasks before implementation commits.
2. **Review all AI output** — Verify generated code against acceptance criteria in two browser tabs before committing.
3. **No scope creep** — Do not add timers, multi-round rotation, auth, databases, or new dependencies unless the spec justifies them.
4. **Traceable commits** — Each commit maps to a task in `tasks.md`. Commit messages use conventional prefixes (`feat`, `fix`, `docs`, `test`).
5. **Artifacts stay aligned** — If implementation deviates from spec, update the spec and document the reason.

## Review Discipline

1. **Two-tab validation** — Every scenario is verified with two browser tabs simulating host and joiner.
2. **Edge cases required** — Empty names, invalid room codes, case-insensitive guesses, multi-room isolation.
3. **Build must pass** — Run `npm run build` and `npm test` in both backend and frontend before PR.
4. **Pre-evaluation check** — Ensure constitution (≥800 chars), 4 feature folders with spec/plan/tasks, and reflection (≥500 chars) exist.
5. **Self-review checklist** — Before each commit: Does behavior match spec? Are forbidden technologies absent? Is viewer-specific data filtered on the backend?

## Testing Expectations

- Extend existing Vitest tests for roomStore and API schemas.
- Test name validation, host assignment, start preconditions, guess scoring, and restart reset in backend unit tests.
- Manual two-tab testing is the primary integration validation method for this lab.
