# API, Data Model, Edge Cases & Gameplay Logic Checklist: Gameplay Interaction

**Purpose**: Validate requirements quality across API contracts, data model, edge cases, and gameplay logic for the drawing, guessing, history, and scoring features
**Created**: 2026-05-20
**Feature**: specs/003-gameplay-interaction/spec.md

## API Contract Completeness

- [ ] CHK001 Are error response bodies specified with all required fields (status, message) for every failure path on POST /rooms/:code/draw? [Completeness, Contracts §POST /draw Errors]
- [ ] CHK002 Are error response bodies specified with all required fields for every failure path on POST /rooms/:code/guess? [Completeness, Contracts §POST /guess Errors]
- [ ] CHK003 Is the POST /rooms/:code/draw success response contract documented for both drawing (non-empty strokes) and clearing (empty strokes array) scenarios? [Completeness, Contracts §POST /draw Response 200]
- [ ] CHK004 Is the POST /rooms/:code/guess success response contract documented for both correct (isCorrect: true, score updated) and incorrect (isCorrect: false, score unchanged) scenarios? [Completeness, Contracts §POST /guess Response 200]
- [ ] CHK005 Is the GET /rooms/:code response contract documented showing all new gameplay fields (strokes, guesses, scores, correctGuessers) in the active-game state? [Completeness, Contracts §GET /:code Response 200]
- [ ] CHK006 Are the unchanged endpoints (POST /rooms, /join, /start) explicitly listed as not modified by this feature? [Completeness, Contracts §Unchanged Endpoints]

## API Contract Clarity & Consistency

- [ ] CHK007 Is the stroke validation rule "minimum 2 points per stroke" consistently described across the contracts and data model? [Consistency, Contracts §POST /draw vs Data Model §CanvasStroke]
- [ ] CHK008 Is the drawer authorization requirement for POST /rooms/:code/draw consistently described in both the endpoint description and the error table? [Clarity, Contracts §POST /draw]
- [ ] CHK009 Is the guesser authorization requirement (drawer cannot guess) consistently documented for POST /rooms/:code/guess? [Clarity, Contracts §POST /guess]
- [ ] CHK010 Are all response examples internally consistent — do participant names, IDs, and role assignments match across the draw response, guess response, and GET response examples? [Consistency, Contracts]
- [ ] CHK011 Is the whitespace trimming behavior documented as a server-side responsibility (not client-side only)? [Clarity, Spec §FR-006]
- [ ] CHK012 Is the case-insensitive comparison behavior documented as the evaluation formula (e.g., `trim().toLowerCase()`) rather than a vague "case-insensitive" statement? [Clarity, Spec §FR-007, Data Model §Guess]

## Data Model Completeness

- [ ] CHK013 Are all new Round fields (strokes, guesses, scores, correctGuessers) documented with types and constraints? [Completeness, Data Model §Round]
- [ ] CHK014 Are all new RoundSnapshot fields documented with visibility rules (which roles see which fields)? [Completeness, Data Model §RoomSnapshot]
- [ ] CHK015 Is the distinction between Guess (internal) and GuessSnapshot (public) types documented, including which fields differ? [Completeness, Data Model §Guess vs §GuessSnapshot]
- [ ] CHK016 Is the Score entity documented with its initialization behavior (all participants start at 0) and the scoring formula? [Completeness, Data Model §Score, Assumptions]
- [ ] CHK017 Is the CanvasStroke point coordinate system documented as normalized (0-1) rather than pixel-based? [Clarity, Data Model §CanvasStroke]
- [ ] CHK018 Are the CanvasStroke color and width fields documented as v1-constant values vs future-extensible? [Clarity, Data Model §CanvasStroke]

## Data Model Clarity

- [ ] CHK019 Is the `submittedAt` timestamp documented as server-assigned (not client-provided)? [Clarity, Data Model §Guess]
- [ ] CHK020 Is the `correctGuessers` array's purpose (both for server-side rejection and frontend UI disable) documented? [Clarity, Data Model §Round, Spec §FR-013]
- [ ] CHK021 Is the scores data structure format (Record<string, number> keyed by participantId) documented and consistent across data model and contracts? [Consistency, Data Model §Score vs Spec §Key Entities]

## Edge Case & Error Handling Coverage

- [ ] CHK022 Is the "drawer submits guess" rejection documented at both the API level (403 error code) and the UI level (input hidden from drawer)? [Coverage, Spec §FR-017, Contracts §POST /guess Errors]
- [ ] CHK023 Is the "already-correct guesser submits again" rejection documented at both the API level (403 error code) and the UI level (input disabled)? [Coverage, Spec §FR-013, Contracts §POST /guess Errors]
- [ ] CHK024 Is the empty/whitespace-only guess rejection behavior (400 error, no server state change) documented? [Coverage, Spec §FR-008, Contracts §POST /guess Errors]
- [ ] CHK025 Is the maximum guess length (50 characters after trim, not before) documented correctly across spec, data model, and contracts? [Consistency, Spec §FR-009 vs Data Model §Guess vs Contracts §POST /guess]
- [ ] CHK026 Is the duplicate-incorrect-guess behavior (no deduplication, each guess accepted independently) documented? [Coverage, Spec §Edge Cases]
- [ ] CHK027 Is the drawer-disconnect mid-draw behavior (last synced state preserved, polling continues) documented? [Coverage, Spec §Edge Cases]
- [ ] CHK028 Is the "all players correctly guessed" scenario documented with the expected behavior (round continues, input disabled)? [Coverage, Spec §Edge Cases]
- [ ] CHK029 Is the concurrent-multiple-correct scenario (multiple guessers guess the same correct word) documented? [Coverage, Spec §US4-SC3]

## Gameplay Logic Specification

- [ ] CHK030 Is the guess evaluation timing documented as "immediately upon submission" (server-side, not batched)? [Clarity, Spec §FR-010]
- [ ] CHK031 Is the scoring rule "correct = +100, incorrect = +0" documented with precise conditions and no ambiguity? [Clarity, Spec §FR-011, FR-012]
- [ ] CHK032 Is the guess history ordering rule (oldest first, by submission timestamp) documented? [Clarity, Spec §US3-SC2]
- [ ] CHK033 Is the polling sync behavior documented consistently across canvas strokes (FR-004), guess history (FR-016), and scores (FR-018)? [Consistency, Spec §FR-004, FR-016, FR-018]
- [ ] CHK034 Is the "correct guess visual highlight" requirement specified with enough detail to be testable? [Measurability, Spec §FR-014]
- [ ] CHK035 Is the drawer-canvas-visibility requirement (drawer sees drawing within same polling cycle) documented with measurable criteria? [Measurability, Spec §FR-003]
- [ ] CHK036 Is the game state transition behavior (drawing remains drawing after correct guess, only the correct guesser's input changes) documented? [Completeness, Data Model §State Transitions]
- [ ] CHK037 Is the "round continues after all players correctly guessed" behavior documented? [Completeness, Spec §Edge Cases]
- [ ] CHK038 Is the scores initialization requirement (0 for all participants at round creation) documented in functional requirements? [Gap, Spec §FR-011 mentions scoring but not initialization]
- [ ] CHK039 Is the polling interval duration documented or is it left as an implementation detail? [Clarity, Spec §Success Criteria references "same polling cycle" without specifying the interval]

## Notes

- Items are numbered sequentially (CHK001–CHK039) for easy reference
- Mark completed items: `[x]`
- Each item tests REQUIREMENTS QUALITY, not implementation correctness
- Focus areas: API contracts (A), data model (C), edge cases (D), gameplay logic (E)
- Depth: Standard
- Audience: Reviewer
