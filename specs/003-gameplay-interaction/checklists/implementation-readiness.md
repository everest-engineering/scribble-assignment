# Implementation Readiness Checklist: Gameplay Interaction

**Purpose**: Validate that tasks.md, spec.md, and design artifacts are clear and complete enough to implement without ambiguity — pre-implementation self-review
**Created**: 2026-06-03
**Feature**: [spec.md](../spec.md) · [tasks.md](../tasks.md) · [plan.md](../plan.md)
**Focus**: Implementation readiness · **Depth**: Thorough · **Audience**: Author (pre-implement)

---

## Task Completeness

- [x] CHK001 - Are all 19 functional requirements (FR-001–FR-019) traceable to at least one task in tasks.md? [Completeness, Spec §FR-001–FR-019]
- [x] CHK002 - Are all 6 success criteria (SC-001–SC-006) traceable to at least one task in tasks.md? [Completeness, Spec §SC-001–SC-006]
- [x] CHK003 - Are all new types (`Point`, `Stroke`, `Guess`, `CanvasState`) fully defined in data-model.md before T001 begins — is the implementer's source of truth clear? [Completeness, data-model.md]
- [x] CHK004 - Are both new endpoints fully specified in contracts/api.md including all error HTTP status codes and Zod schema field shapes? [Completeness, contracts/api.md]
- [x] CHK005 - Is there a task (or explicit documentation) confirming that `frontend/src/state/roomStore.ts` requires no changes for the new `strokes`, `guesses`, `scores` fields to flow through automatically? [Completeness, Gap — Assumption]

---

## Task Clarity

- [x] CHK006 - Is "wholesale redraw" in T008 specific enough — does it define the canvas rendering sequence (clear → iterate strokes → draw each point sequence) unambiguously? [Clarity, tasks.md T008]
- [x] CHK007 - Is "immediate local feedback" in T014 specific enough — does it identify the exact UI element (e.g., inline message, badge, colour change) that displays the correct/incorrect result? [Clarity, tasks.md T014]
- [x] CHK008 - Does T011 specify the order of validation steps clearly enough to implement correctly without guessing — are FR-008 (trim), FR-007 (reject empty after trim), FR-009 (case-insensitive), and FR-019 (once-per-guesser) applied in the stated sequence? [Clarity, tasks.md T011]
- [x] CHK009 - Is "sorted by score descending" in T019 specific enough — is tie-breaking behaviour defined (e.g., alphabetical by name, or insertion/join order)? [Clarity, tasks.md T019]
- [x] CHK010 - Is the return value of `updateCanvas()` in T005 clearly specified — does the task state it returns a `RoomSnapshot` (matching the contracts/api.md `{ room }` response)? [Clarity, tasks.md T005]

---

## Task Consistency

- [x] CHK011 - Do T016 (`ResultPanel`) and T019 (`Scoreboard`) both use the same `Participant` type from `frontend/src/services/api.ts`, or is the import source ambiguous? [Consistency, tasks.md T016, T019]
- [x] CHK012 - Are the CSS BEM class naming conventions consistent across T010 (`.drawing-canvas__*`), T017 (`.guess-list__*`), and T020 (`.scoreboard__*`) with the existing app.css patterns? [Consistency, tasks.md T010, T017, T020]
- [x] CHK013 - Does T003's extension of `toRoomSnapshot()` align with contracts/api.md — are `strokes`, `guesses`, and `scores` specified to be included only when `status === "playing"`, consistent with how `currentDrawerId` was handled in feature 002? [Consistency, tasks.md T003, contracts/api.md]
- [x] CHK014 - Is the HTTP verb for the canvas update endpoint consistent across all artifacts — does tasks.md (T006), contracts/api.md, and plan.md all say `PATCH` (not `POST` or `PUT`)? [Consistency, tasks.md T006, contracts/api.md, plan.md]

---

## Acceptance Criteria Quality

- [x] CHK015 - Does each phase checkpoint define a specific, verifiable condition — not just "story should be functional" but a concrete observable outcome? [Acceptance Criteria, tasks.md Phase checkpoints]
- [x] CHK016 - Are the independent test instructions for each user story (Phases 3–6) specific enough to execute without ambiguity — do they state exact inputs, exact expected outputs, and who performs each action? [Acceptance Criteria, tasks.md Phases 3–6]
- [x] CHK017 - Is SC-002 ("within one screen refresh of submission") measurable — is it clear this means the synchronous React state update cycle (not a deferred effect or the next poll), so an implementer can verify it without instrumentation? [Acceptance Criteria, Spec §SC-002]

---

## Scenario Coverage

- [x] CHK018 - Are requirements defined for what the drawer's UI should show while the canvas `PATCH` request is in-flight — is a loading/disabled state required, or is fire-and-forget acceptable? [Coverage, Gap]
- [x] CHK019 - Are requirements defined for the visual state of an in-progress stroke on the drawer's canvas _before_ `pointerup` fires and the stroke is sent to the server — is a local preview of the current stroke specified? [Coverage, Gap — in-progress stroke visibility]
- [x] CHK020 - Are requirements defined for what `GuessForm` shows while a guess submission is pending (network in-flight) — is the submit button disabled, and is there a loading indicator? [Coverage, Gap]
- [x] CHK021 - Are requirements defined for what happens when `api.submitGuess()` or `api.updateCanvas()` receives a network error — is an error message shown, or does the UI fail silently? [Coverage, Gap — error handling]

---

## Edge Case Coverage

- [x] CHK022 - Is the edge case "drawer bypasses the hidden form and submits a guess via direct API call" covered by server-side validation in T011 (validate submitter ≠ `currentDrawerId` server-side, not only client-side)? [Edge Case, tasks.md T011, Spec edge case 2]
- [x] CHK023 - Is the edge case "canvas cleared before any stroke is drawn (`strokes = []`)" explicitly handled by T008's redraw logic — is a "clear on empty array" path specified? [Edge Case, tasks.md T008]
- [x] CHK024 - Is the edge case "`participantId` in the canvas PATCH request belongs to a participant who is not in the room" covered by T005's validation, or only the "not the drawer" check? [Edge Case, tasks.md T005]
- [x] CHK025 - Is the edge case "guess submitted when `room.status` has returned to `'lobby'`" (e.g., host navigated away) covered by T011's status check? [Edge Case, tasks.md T011]

---

## Non-Functional Requirements

- [x] CHK026 - Is the decision to reuse the existing 2-second polling interval (no new polling logic needed) explicitly stated in tasks.md so the implementer does not inadvertently add a separate polling loop for canvas or guesses? [NFR, Spec Assumption 7, tasks.md]
- [x] CHK027 - Is the accepted risk of unbounded canvas payload growth (no stroke limit, per Q1: A) documented somewhere an implementer will see it — is there a note in tasks.md or data-model.md? [NFR, Spec Assumption / Q1 resolution]
- [x] CHK028 - Are accessibility requirements defined for the canvas element — is `aria-label` or a text alternative specified, or is accessibility explicitly scoped out for this feature? [NFR, Gap — Accessibility]
- [x] CHK029 - Are accessibility requirements defined for the guess form's inline validation message — is `role="alert"` or `aria-live` specified so screen readers announce the error, or is this explicitly out of scope? [NFR, Gap — Accessibility]

---

## Security & Validation Boundaries

- [x] CHK030 - Are T005's server-side validation requirements specified to verify _both_ that `participantId` exists in `room.participants` AND that they are the current drawer — not just the latter? [Security, tasks.md T005, contracts/api.md]
- [x] CHK031 - Does T011's validation specify that `text` consisting entirely of whitespace must be rejected _after trimming_ (i.e., `text.trim().length === 0` → 400) — not just `text.length === 0`? [Security, tasks.md T011, Spec §FR-007]
- [x] CHK032 - Does T004's Zod schema for `strokes` specify that each point's `x` and `y` must be finite numbers — preventing `NaN` or `Infinity` values from being stored in room state? [Security, tasks.md T004, data-model.md]

---

## Dependencies & Assumptions

- [x] CHK033 - Is the single-threaded Node.js event loop assumption for the FR-019 "award once per guesser" check documented in tasks.md T011 — so the implementer does not add unnecessary mutex logic? [Assumption, tasks.md T011]
- [x] CHK034 - Is the sequential constraint on T009/T015/T018/T021 (all modify `GamePage.tsx`) visible in the dependencies section of tasks.md — can an implementer immediately see they cannot be parallelised? [Dependency, tasks.md Dependencies section]
- [x] CHK035 - Is the dependency of US3 (T016–T018) and US4 (T019–T021) on US2's backend (T011–T012) explicitly stated — and does the tasks.md phase dependency table make it clear that display components (T016, T017, T019, T020) can be built before the backend is ready? [Dependency, tasks.md Dependencies section]
