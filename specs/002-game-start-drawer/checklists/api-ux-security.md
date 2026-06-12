# Pre-Planning Checklist: API, UI/UX & Security Quality

**Purpose**: Lightweight pre-planning sanity check for the Game Start — First Round Drawer & Secret Word specification
**Created**: 2026-06-11
**Focus**: API/data model correctness, UI/UX behaviour clarity, secret-word security gating
**Feature**: [spec.md](../spec.md)

---

## Requirement Completeness

- [x] **CHK001**: Does the spec explicitly require name trimming on BOTH `create-room` and `join-room` endpoints, or only one?
- [x] **CHK002**: Is the exact UI transition mechanism from lobby to game screen defined (e.g., route change, conditional rendering, polling cadence)?
- [x] **CHK003**: Does the spec document how the `RoomSnapshot` type change (from `roles` array to `drawerId`) affects existing client code?
- [x] **CHK004**: Is the deterministic word-selection algorithm specified beyond "first word" (e.g., index-based, list exhaustion)?
- [x] **CHK005**: Does the spec define state cleanup semantics when the host leaves mid-round for ALL round-related fields (`drawerId`, `currentWord`, `status`)?

## Requirement Clarity

- [x] **CHK006**: Is "clearly identified" for the drawer quantified (e.g., text label, highlighted avatar, badge) rather than left as subjective design direction?
- [x] **CHK007**: Is the "clear error message" for empty/whitespace names or too-few-players defined with expected HTTP status code and response shape?
- [x] **CHK008**: Is the rejection behaviour for non-host start attempts explicitly silent-failure, explicit error message, or UI button disabled?
- [x] **CHK009**: Is the `GET /rooms/:code` secret-word visibility rule unambiguous about whether `currentWord` is omitted or `null` for guessers?

## Requirement Consistency

- [x] **CHK010**: Does the `RoomSnapshot` definition consistently use `currentWord: string | null` across all documented API contracts and clarifications?
- [x] **CHK011**: Do the edge-case definitions for host leaving mid-round contradict any success criteria or out-of-scope items (e.g., restart logic)?
- [x] **CHK012**: Does the deterministic `rocket` first-word rule align with the "only one round" assumption in the constitution, or imply future extensibility?

## Acceptance Criteria Measurability

- [x] **CHK013**: Is "under 2 seconds" (SC-001) measured from host click, from API response, or from first render frame?
- [x] **CHK014**: Is "100% of attempts are blocked" (SC-002, SC-003) testable without enumerating every possible whitespace permutation?
- [x] **CHK015**: Is "0% of guesser API responses expose the secret word" (SC-005) verifiable at the schema/contract level or only via manual UI inspection?

## Security & Edge-Case Coverage

- [x] **CHK016**: **[GATING]** Does the spec explicitly require secret-word suppression in ALL API responses (not just `GET /rooms/:code`, including any join-room or participant-list endpoints)?
- [x] **CHK017**: **[GATING]** Does the spec address server-side validation of the `drawerId` field to prevent a malicious client from spoofing drawer identity?
- [x] **CHK018**: Does the spec cover the race condition where two hosts exist (Clarification #4) with a server-authoritative resolution mechanism?
- [x] **CHK019**: Does the spec define the exact behaviour when a player refreshes during `playing` status (rejection vs. spectator vs. re-join)?

## Constitution Alignment

- [x] **CHK020**: Do the requirements comply with **In-Memory State Discipline** (no persistence of round state across restarts implied)?
- [x] **CHK021**: Do the requirements comply with **HTTP Polling Only** (no WebSocket or SSE mechanism for game-start or word reveal)?
- [x] **CHK022**: Do the requirements comply with **Extend the Starter** (no new top-level dependencies or rewrite of room model)?
