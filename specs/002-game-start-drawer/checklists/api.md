# API & Game State Requirements Quality Checklist: Game Start and Drawer Flow

**Purpose**: Validate the quality, clarity, and completeness of API and game state requirements for the Game Start and Drawer Flow feature
**Created**: 2026-05-19
**Focus**: API Contracts & Game State (word isolation emphasis)

## Requirement Completeness

- [X] CHK001 - Are error response schemas defined for every failure condition in the start game endpoint? [Completeness, Spec §FR-001/FR-008, contracts/api.md]
- [X] CHK002 - Is the RoundSnapshot schema fully documented including which fields are conditional (secretWord only for drawer)? [Completeness, Spec §FR-005, data-model.md]
- [X] CHK003 - Are requirements specified for RoomSnapshot behavior when no round exists (lobby state — currentRound: null)? [Completeness, Spec Assumptions, contracts/api.md]
- [X] CHK004 - Is the deterministic word selection algorithm specified with enough detail that an independent implementation produces the same result? [Completeness, Spec §FR-004]
- [X] CHK005 - Are name re-validation requirements specified at the API contract level (which endpoint returns which error)? [Completeness, Spec §FR-001]
- [X] CHK006 - Are word list expansion requirements documented as a contract change (20+ entries, alphabetically sorted or arbitrary order)? [Completeness, Spec §FR-006/FR-007]

## Requirement Clarity

- [X] CHK007 - Is "deterministically selected" defined unambiguously — what input data determines the word selection? [Clarity, Spec §FR-004]
- [X] CHK008 - Is "word visible only to drawer" specified at the field level in the API contract (secretWord is string for drawer, undefined/null/absent for others)? [Clarity, Spec §FR-005, contracts/api.md]
- [X] CHK009 - Is "atomic game start" defined in terms of observable API behavior — either all state changes occur or the room remains in lobby? [Clarity, Spec Clarifications]
- [X] CHK010 - Is the drawer identification mechanism specified at the API level (drawerId in RoundSnapshot, not just a UI concept)? [Clarity, Spec §FR-002/FR-003, data-model.md]
- [X] CHK011 - Is the name re-validation error message specified with exact wording? [Clarity, Spec §FR-001]
- [X] CHK012 - Is the empty word list error message format specified down to the exact text? [Clarity, Spec §FR-008]

## Requirement Consistency

- [X] CHK013 - Does the word visibility contract remain consistent between POST /rooms/:code/start and GET /rooms/:code responses? [Consistency, contracts/api.md]
- [X] CHK014 - Are the error status codes used consistently (400 vs 403 vs 404 vs 503) across all game-start failure conditions? [Consistency, Spec §FR-001/FR-008, contracts/api.md]
- [X] CHK015 - Does the RoundSnapshot schema in data-model.md match the examples in contracts/api.md? [Consistency]
- [X] CHK016 - Is the drawerId field type consistent between Round.entity (string-UUID) and how it appears in API responses? [Consistency, data-model.md, contracts/api.md]
- [X] CHK017 - Are "lobby" status requirements for currentRound=null consistent with the existing Phase 1 room state contract? [Consistency, Spec Assumptions]

## Acceptance Criteria Quality

- [X] CHK018 - Can "word is visible only to the drawer" be objectively verified by inspecting API responses from drawer vs guesser perspectives? [Measurability, Spec §FR-005, SC-002]
- [X] CHK019 - Can "same word for same room code" be verified by restarting identical conditions? [Measurability, Spec §FR-004, SC-003]
- [X] CHK020 - Can "atomic game start" failure mode be verified (either status=active+round exists or status=lobby+round=null)? [Measurability, Spec Clarifications]
- [X] CHK021 - Is "within 2 seconds" (SC-001) verifiable without specialized tooling? [Measurability, Spec §SC-001]

## Scenario Coverage

- [X] CHK022 - Is the start-game API scenario specified for all participant boundary conditions (1 player rejected, 2 players accepted, 8 players accepted)? [Coverage, Spec §FR-010]
- [X] CHK023 - Is word isolation specified for all API consumers: drawer, guesser, and unauthenticated/non-participant viewers? [Coverage, Spec §FR-005] _(Note: frontend always sends participantId; API without participantId treated as non-drawer — secure by default)_
- [X] CHK024 - Are requirements specified for how round data appears during the brief window between game start and the drawer's first fetch? [Coverage, Gap] _(Note: atomic creation means round data exists from the first post-start snapshot)_
- [X] CHK025 - Are the concurrent access requirements specified (multiple players polling GET /rooms/:code simultaneously after game start)? [Coverage, Gap] _(Note: in-memory Node.js store is single-threaded; no real concurrency concern)_

## Edge Case Coverage

- [X] CHK026 - Is the behavior specified when the room code is an empty string or contains only whitespace in the start endpoint? [Edge Case, contracts/api.md] _(handled by Zod schema validation)_
- [X] CHK027 - Is error behavior specified when the word list has exactly 20 entries (minimum boundary)? [Edge Case, Spec §FR-006] _(works normally at any count ≥1)_
- [X] CHK028 - Is error behavior specified when participantId query param on GET /rooms/:code does not match any participant in the room? [Edge Case, Gap] _(treated as non-drawer — word filtered out; secure by default)_
- [X] CHK029 - Is word isolation behavior specified for the drawer-disconnect-abort path (does the Round persist or get cleaned up)? [Edge Case, Spec Clarifications]
- [X] CHK030 - Is the behavior specified when the word list is modified between game starts? [Edge Case, Spec §FR-004] _(deterministic per room code at time of start; word may differ if list changes — acceptable)_

## Non-Functional Requirements

- [X] CHK031 - Are word isolation requirements specified in security terms (no API endpoint or response field leaks the word to non-drawer)? [Security, Spec §FR-005]
- [X] CHK032 - Are word selection performance requirements specified (deterministic selection should not add measurable latency)? [Performance, Spec assumptions] _(trivial O(n) hash operation)_
- [X] CHK033 - Are snapshot generation performance requirements specified considering word filtering overhead? [Performance, Gap] _(negligible impact — single field conditional check)_

## Ambiguities & Conflicts

- [X] CHK034 - Are any terms used in the API contract undefined or multi-interpretable (e.g., "drawing" status, "deterministic")? [Ambiguity, Spec §FR-004, data-model.md]
- [X] CHK035 - Could a reader interpret "word visible only to drawer" as a UI concern only, missing the API-level filtering requirement? [Ambiguity, Spec §FR-005]
- [X] CHK036 - Is there any conflict between the Phase 1 "availableWords" field (full list) and the Phase 2 word isolation (selected word filtered per viewer)? [Conflict, data-model.md, spec.md]
