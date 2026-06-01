# Speckit Constitution

## Engineering Principles

1. **Brownfield-first development** — All changes must extend the existing architecture. Do not rewrite files wholesale. Preserve existing patterns, naming conventions, and file organization.

2. **Small incremental changes** — Each commit must represent one logical change. Prefer multiple small commits over one large commit.

3. **Spec before implementation** — No code is written until the specification for that feature group exists and is reviewed. Specifications must include acceptance criteria and edge cases.

4. **Validation before completion** — After each feature group implementation, validate against all acceptance criteria and edge cases. Do not proceed to the next group until validation passes.

5. **No speculative refactoring** — Only change code that is directly related to the feature being implemented. Do not reformat, rename, restructure, or "improve" unrelated code.

## AI Usage Rules

6. **AI-generated code must be reviewed** — Every AI-generated change must be read and understood before committing. Do not trust AI output blindly.

7. **Single responsibility per prompt** — Each AI interaction must target one specific task from the task list. Do not ask AI to implement multiple features in one request.

8. **Traceability** — Every commit must reference the specification section it implements. Commit messages must be descriptive and follow conventional commit format.

## Technical Constraints

9. **Polling over push** — All state synchronization uses HTTP polling (~2s intervals). No WebSockets, Server-Sent Events, or long-polling.

10. **In-memory only** — No databases. All state resides in Node.js memory. Restarting the backend clears all state.

11. **No authentication** — No user accounts, sessions, JWT, or OAuth. Players are identified by participant IDs returned at room creation/join.

12. **No new dependencies** — Do not add new npm packages unless explicitly required and justified in the plan.

13. **Architecture consistency** — Backend follows `models/` -> `services/` -> `api/` layering. Frontend follows `services/` -> `state/` -> `pages/` -> `components/` layering.

## Game Logic Rules

14. **Deterministic behavior** — All game mechanics (word selection, drawer assignment, scoring) must be deterministic given the same inputs. Randomness is only used for room code generation.

15. **Server authority** — The backend is the single source of truth. The frontend only displays state returned by the backend. The frontend never computes game outcomes.

16. **Idempotent operations** — Repeated requests (e.g., polling) must not produce side effects or duplicate state.

## Commit Discipline

17. **Granular commits** — Each commit must be independently explainable. Use conventional commit format: `type(scope): description`.

18. **Commit types**: `feat` (new feature), `fix` (bug fix), `docs` (spec/plan/task updates), `refactor` (structural changes), `test` (test-only changes), `chore` (tooling).

19. **No mixed concerns** — A single commit must not mix changes to unrelated feature groups or files.

20. **Artifacts committed first** — Specification, plan, and task changes must be committed before implementation commits for that feature group.
