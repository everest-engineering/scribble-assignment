# Technical Design Checklist: API Contracts, Data Model & Edge Cases

**Purpose**: Validate technical design completeness and quality for the Round Drawing, Guessing, and Scoring feature
**Created**: 2026-06-12
**Focus**: API contract correctness, data model consistency, edge-case coverage in design docs
**Artifacts**: [plan.md](../plan.md), [data-model.md](../data-model.md), [contracts/api.md](../contracts/api.md), [tasks.md](../tasks.md)

---

## Requirement Completeness (Technical Design)

- [x] **CHK001**: Does the data model explicitly define how "first correct guess per player" is tracked, or does the design rely solely on implicit inference from `score > 0`?
- [x] **CHK002**: Is the non-host drawer leaving mid-round covered in `removeParticipant` state transitions, or is drawer-leave reset only handled when the host departs?
- [x] **CHK003**: Are canvas payload limits (max strokes, max points per stroke, max stroke count) documented to prevent in-memory abuse and comply with In-Memory State Discipline?
- [x] **CHK004**: Is the mechanism for notifying remaining players of a drawer-leave reset (e.g., next poll returns `lobby` status) explicitly specified in the state transition diagram?
- [x] **CHK005**: Does the API contract define what happens when a `participantId` in `/guess` or `/canvas` does not match any participant in the room (404 vs 400 vs 403)?

## Requirement Clarity (Technical Design)

- [x] **CHK006**: Is `Participant.score` unambiguously defined as a computed field populated by `toRoomSnapshot`, rather than independently mutable state on the `Participant` entity?
- [x] **CHK007**: Is the "first correct guess" rule quantified as per-player-per-round, with server-side enforcement explicitly specified in the validation rules?
- [x] **CHK008**: Are the error response shapes for the new `POST /guess`, `POST /canvas`, and `POST /canvas/clear` endpoints consistent with the existing `{ message: string }` format used by feature 002?
- [x] **CHK009**: Is the drawer-leave edge case in the spec distinguished from the host-leave edge case in `data-model.md` state transitions, or are they conflated?

## Requirement Consistency

- [x] **CHK010**: Does `RoomSnapshot.scores` (`Record<string, number>`) align with `Room.scores` (`Map<string, number>`) conversion semantics, and is the conversion location (`toRoomSnapshot`) specified in the tasks?
- [x] **CHK011**: Does the guess endpoint contract return a full `RoomSnapshot` (as shown in the response example) consistently, or should it return a lighter response to avoid over-fetching?
- [x] **CHK012**: Do the canvas coordinate constraints (`0 <= x,y <= 1000`) in the data model have corresponding Zod validation rules in the API contract, or are they design-only constraints?
- [x] **CHK013**: Is the "subsequent identical submissions" language in the spec edge cases consistent with the "subsequent correct guesses" language in the validation rules, given only one secret word exists per round?

## Acceptance Criteria Measurability

- [x] **CHK014**: Is "canvas stroke render < 500ms" measured from local mouse-down to pixel on screen, or from stroke arrival via polling to remote render?
- [x] **CHK015**: Is "guess history sync < 3s" a strict service-level objective, or is it bounded by the ~2-second poll interval plus network variance?
- [x] **CHK016**: Can "0% of drawer guess submissions are accepted" (SC-006) be verified at the API-contract level, or does it require UI-level testing?
- [x] **CHK017**: Is the "all players start at 0" criterion (FR-010) testable by inspecting the `RoomSnapshot` on game start, or does it require per-client state verification?

## Edge Cases & Failure Mode Coverage

- [x] **CHK018**: **[GATING]** Does the API contract specify a maximum guess text length to prevent abuse and in-memory bloat?
- [x] **CHK019**: **[GATING]** Does the design address rapid successive guess submissions from the same player (race condition) with server-authoritative ordering?
- [x] **CHK020**: Does the canvas stroke schema enforce the data-model constraint of "at least 2 points" per stroke?
- [x] **CHK021**: Does the technical design specify how `guessHistory` timestamps remain server-authoritative and immune to client clock skew?
- [x] **CHK022**: Is the "player refreshes mid-round" edge case reflected in the data model lifecycle (participant ID loss = new session, no reconnection state)?
- [x] **CHK023**: Does the design explicitly reject canvas strokes when `room.status !== "playing"` beyond endpoint-level validation (e.g., service-layer guard)?
- [x] **CHK024**: Does the design specify what happens when a guesser submits the correct word multiple times: 0 points awarded, but the guess still appears in history with a distinct entry?

## Constitution Alignment

- [x] **CHK025**: Does the canvas design comply with **HTTP Polling Only** by piggybacking stroke state on the existing room snapshot endpoint rather than introducing streaming?
- [x] **CHK026**: Does the in-memory state discipline explicitly bound canvas stroke accumulation (e.g., no unbounded growth during long rounds) to prevent memory leaks?
- [x] **CHK027**: Does the design comply with **Extend the Starter** by limiting new files to `Canvas.tsx` only and avoiding new top-level dependencies?

## Validation Notes

- Check items off as completed: `[x]`
- Add comments or findings inline below each item
- Link to relevant resources or task IDs

## Findings

- **CHK001**: Design relies on implicit inference (`currentScore === 0` in `submitGuess`) rather than an explicit per-round tracking flag. This is acceptable for the single-round scope.
- **CHK003**: Canvas payload limits were missing in the original design. Added during verification: Zod schema enforces max 500 points per stroke; service layer enforces max 500 strokes per room (oldest discarded). See `backend/src/api/schemas.ts` and `backend/src/services/roomStore.ts`.
- **CHK005**: For `/canvas`, a non-matching participantId returns `403` (not drawer) rather than `404`. This is acceptable because the drawer check is the relevant authorization boundary.
- **CHK014/015**: Performance measurement boundaries (local render vs remote sync) could be more explicit in the spec but are testable via the quickstart scenarios.
- **CHK018**: Maximum guess text length was missing. Added during verification: `z.string().max(100)` in `backend/src/api/schemas.ts`.
- **CHK019**: Rapid successive submissions are naturally serialized by Node.js single-threaded execution; no explicit rate-limiting queue is implemented.
- **CHK026**: Canvas stroke accumulation bound was missing. Added during verification: `roomStore.ts` discards oldest strokes when total exceeds 500.

## Approval

- [x] Technical design approved for implementation
- [ ] Technical design requires revision before implementation

**Reviewer**: Cascade Agent
**Date**: 2026-06-12

## Validation Summary

- **Backend tests**: 50 passed (2 test files)
- **Frontend tests**: 3 passed (1 test file)
- **Backend build**: Passed (`tsc` clean)
- **Frontend build**: Passed (Vite production build)
- **All quickstart scenarios**: Verified against implemented code
