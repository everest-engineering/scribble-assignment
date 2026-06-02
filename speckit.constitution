# Scribble Assignment Constitution

## Purpose
This constitution defines the engineering rules for implementing the Scribble assignment as a brownfield enhancement. All specification, planning, implementation, review, and validation work must comply with these principles.

## Principles

### 1. Brownfield-first changes
The starter application must be extended, not rewritten. Existing structure, routes, and basic flows should be preserved unless a change is necessary to satisfy a scenario and the reason is documented.

### 2. Spec before implementation
No feature work should begin until the current discovery notes, specification, plan, and task list are updated for that feature group. Implementation must trace to an explicit acceptance criterion.

### 3. Out-of-scope discipline
The solution must not introduce WebSockets, persistent storage, authentication, deployment work, Docker, new top-level architectural frameworks, or unrelated refactors. Multiple rounds, timers, moderation, spectator mode, random/custom word packs, and drawer rotation are excluded.

### 4. Backend as source of truth
Room state, participant state, round state, guesses, drawing data, and scores must be derived from backend state. Frontend local state may cache UI state but must not become the long-lived authority for shared game behavior.

### 5. Deterministic and testable behavior
Word selection, drawer assignment, scoring, validation, and restart behavior must be deterministic enough to verify consistently in manual testing and code review.

### 6. Clear user-facing validation
Every invalid action must return clear feedback in the UI and, where applicable, a clear backend error response. Silent fallback behavior is not acceptable when the scenario requires explicit rejection.

### 7. Small, reviewable increments
Changes must be implemented and committed in small slices aligned to the four feature groups. Each commit should remain explainable without requiring hidden context.

### 8. Human review of AI output
AI assistance may be used to draft discovery notes, specifications, plans, tasks, and code, but all generated output must be verified against the repository, adjusted for correctness, and tested before commit.

### 9. Validation is mandatory
Each feature group must be validated in the running application using at least two concurrent clients where relevant. A feature is not complete until its acceptance criteria are verified.

### 10. Traceability over polish
Spec alignment, implementation clarity, and evidence of reasoning are prioritized above extra polish or additional features. Any deviation from plan or spec must be documented.

## Engineering rules
- Prefer the smallest viable change that satisfies the acceptance criteria.
- Keep data contracts explicit; update shared types whenever backend responses change.
- Avoid hidden coupling between screens; use consistent API/service helpers.
- Do not leak secret word information to non-drawer players.
- Restart must preserve room membership while clearing all round-specific state.
- Polling intervals should stay close to 2 seconds and be cleaned up on unmount to avoid leaks.
- Validation logic should be centralized where practical to keep client/server rules aligned.

## Review checklist
Before each commit:
- Discovery/spec/plan/tasks updated where required.
- Code matches the current scenario acceptance criteria.
- No out-of-scope work introduced.
- Manual testing done for affected flow.
- Error messages are explicit and understandable.
- Room isolation verified where shared state changes were made.
- Secret word visibility checked from both drawer and guesser clients where applicable.

## Delivery checklist
Before raising the PR:
- All four scenarios are implemented in one branch.
- Artifacts are committed and internally consistent.
- Reflection report is included.
- PR template is completed with Everest email and role.
- Commit history remains granular and meaningful.