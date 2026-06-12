# Specification Quality Checklist: Functional Requirements (Room Creation & Join)

**Purpose**: Unit tests for requirements quality across all four user stories and supporting artifacts
**Created**: 2026-06-11
**Feature**: [spec.md](../spec.md)
**Coverage**: Broad — User Stories 1–4, Functional Requirements, Success Criteria, Edge Cases, Clarifications

---

## Requirement Completeness

- [ ] **CHK001** — All four user stories (Create Room, Join Room, Host Starts Game, Lobby Auto-Refresh) have at least one acceptance scenario that maps back to a functional requirement.
- [ ] **CHK002** — Every functional requirement (FR-001 through FR-010) is traceable to at least one acceptance scenario or edge-case statement.
- [ ] **CHK003** — Room lifecycle states (lobby vs. playing) and the rules for transitioning between them are explicitly defined, not merely implied by acceptance scenarios.
- [ ] **CHK004** — The `playerId` opaque token mechanism (used for host verification and identity) is described with enough detail to specify contract shape and propagation rules.
- [ ] **CHK005** — The fixed word list (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) and its role in the round are captured in a functional requirement, not only in assumptions.

---

## Requirement Clarity

- [ ] **CHK006** — The phrase "clear error message" (used in FR-005, FR-006, and SC-003/SC-004) is either exemplified or accompanied by a content/template rule so that it is unambiguous during testing.
- [ ] **CHK007** — "Unique room code" is defined with concrete generation constraints (length, character set, case rules) and collision-handling behavior.
- [ ] **CHK008** — "Approximately every 2 seconds" (FR-008) includes an acceptable variance bound (e.g., ±500 ms) so that automated or manual verification is not subjective.
- [ ] **CHK009** — Player name validation rules (trimming, rejection of whitespace-only strings) are identical and unambiguous in both the create-room and join-room paths.
- [ ] **CHK010** — Host transfer criteria (FIFO to the "next player who joined") precisely defines the ordering key (timestamp, join sequence) and whether the new host is notified.

---

## Requirement Consistency

- [ ] **CHK011** — FR-003 (creator is host) and the edge-case "host leaves before starting" do not contradict each other; the transfer rule is framed as an explicit exception, not an override.
- [ ] **CHK012** — FR-009 (only host starts) and US3-AC3 (non-host rejected) remain consistent after a host transfer; the spec does not leave ambiguity about who is "host" after transfer.
- [ ] **CHK013** — FR-008 (poll ~2s) and SC-002 (joiner visible within 3s) use consistent timing references; the 3-second target is demonstrably achievable given the 2-second poll interval plus latency and render time.
- [ ] **CHK014** — FR-007 (rooms fully isolated) is consistent with the observable behavior in acceptance scenarios — no cross-room leakage is implied or required by any other requirement.

---

## Acceptance Criteria Measurability

- [ ] **CHK015** — SC-001 ("under 2 seconds" to reach lobby) defines the measurement boundary (e.g., from click to first rendered frame) and the network conditions under which it applies.
- [ ] **CHK016** — SC-002 ("within 3 seconds") is realistic: 2-second poll interval + estimated server latency + DOM render ≤ 3 s; if not, the criteria should be revised.
- [ ] **CHK017** — SC-005 ("disabled or hidden") selects exactly one behavior and does not leave the UI state ambiguous for testers or implementers.
- [ ] **CHK018** — SC-003 and SC-004 (100% error-message coverage) are paired with expected message content, patterns, or localization rules so that "clear" is objectively verifiable.

---

## Edge Case & Exception Coverage

- [ ] **CHK019** — Host transfer on lobby exit is covered by an acceptance scenario, not relegated only to the clarifications table.
- [ ] **CHK020** — Empty-room cleanup (0 players → immediate delete; idle 10 min → delete) is specified with acceptance criteria or at least an explicit observable trigger.
- [ ] **CHK021** — "Joining a room after game starts" rejection (Clarification #3) has a corresponding acceptance scenario or functional requirement.
- [ ] **CHK022** — Browser refresh / reconnection exclusion ("treated as a new session") is stated as an explicit out-of-scope boundary in the requirements, not only in assumptions.
- [ ] **CHK023** — Duplicate player names within a room have an explicit expected behavior (allowed, no disambiguation required) that is reflected in acceptance scenarios.

---

## Scenario Class Gaps

- [ ] **CHK024** — Alternate flows (e.g., host leaves mid-lobby, player leaves before game starts) are covered beyond the single host-transfer edge case.
- [ ] **CHK025** — Recovery flows (e.g., polling failure, server restart, client offline > poll interval) are specified beyond the "silently retries" clarification.
- [ ] **CHK026** — Non-functional requirements for concurrent room creation (collision probability, rate limiting) are documented or explicitly excluded.
- [ ] **CHK027** — Negative scenarios for name validation are present in both the create-room and join-room user stories (parity check).
- [ ] **CHK028** — The game-start transition is defined with observable criteria for all players (e.g., synchronous route change, state broadcast) rather than only the host action.

---

## Findings

<!-- Add any issues or observations discovered during checklist review -->

-

## Approval

- [ ] Checklist reviewed — requirements quality validated
- [ ] Checklist requires revision before planning

**Reviewer**: ________________
**Date**: ________________
