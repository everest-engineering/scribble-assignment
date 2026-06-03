# Scribble Lab Constitution

This constitution constrains how the Scribble brownfield enhancement is built —
both the human and the AI assistant are bound by it. It exists to keep the spec,
plan, tasks, and implementation in alignment and to keep the work inside the
lab's scope.

## 1. Engineering principles

1. **Extend, never rewrite.** This is a brownfield lab. Reuse the starter's
   structure (`api` / `services` / `models` on the backend; `pages` /
   `components` / `state` / `services` on the frontend). Do not replace working
   code to satisfy taste.
2. **In-memory and HTTP-only.** All state lives in the existing in-memory room
   map. All synchronization is HTTP polling. No WebSockets, no database, no
   auth/sessions, no new persistence.
3. **Deterministic game rules.** Anything a reviewer must reproduce — word
   selection, scoring, drawer assignment — is a pure function of explicit inputs,
   never `Math.random()`. Word selection is derived from the room code; scoring is
   a fixed 100 for the first correct guess, 0 otherwise.
4. **Server is the source of truth.** The backend owns room/round state and
   enforces every rule (host-only actions, 2-player minimum, drawer-only word
   visibility, guess validation). The client renders snapshots and never trusts
   itself for authorization.
5. **Viewer-aware responses.** A snapshot is shaped for its viewer. The secret
   word is included only for the drawer during play, and for everyone once the
   round ends.
6. **Typed and validated at the edges.** No `any`. Zod validates every request
   body/param; the model types describe every response. Validation failures
   return a clear, human-readable message and the correct HTTP status.
7. **Small, immutable-friendly logic.** Prefer pure helpers and copies over
   in-place mutation that leaks across rooms; rooms must stay fully isolated.

## 2. AI usage rules

1. **Spec before code.** For each feature group the assistant updates
   spec → plan → tasks before implementing. Code that has no home in the spec is
   not written.
2. **Scope discipline.** The assistant must refuse to add anything on the
   "Explicitly Out of Scope" list (extra rounds, timers, rotation, spectator
   mode, moderation, new libraries, unrelated refactors), even if it seems
   helpful. Out-of-scope ideas are noted, not built.
3. **No unjustified dependencies.** A new top-level dependency requires an
   explicit justification traceable to a spec line. Default answer is "use what
   the starter ships."
4. **Traceability.** Every commit maps to a scenario/feature group and is small
   enough to explain in one sentence.
5. **Surface assumptions.** When the requirement is ambiguous, the assistant
   records the assumption in the spec/discovery notes and proceeds with the
   simplest in-scope choice rather than inventing scope.

## 3. Review discipline

1. **Self-review before commit.** Re-read the diff against the spec's acceptance
   criteria. Deviations are either fixed or documented in the reflection.
2. **Validate each slice.** Each feature group is verified against its acceptance
   criteria (two browser tabs for multi-player behavior) before moving on.
3. **Green builds and tests.** `npm run build` and `npm test` pass for both
   `backend` and `frontend` before any hand-off. New behavior gets at least one
   test where it is cheaply testable (pure rule functions, request validation).
4. **Honest reporting.** If something is skipped, partial, or a known limitation,
   it is stated plainly in the reflection — never presented as done.
