# Implementation Readiness Checklist: Result, Restart & Final Validation

**Purpose**: Validate that spec, plan, and tasks are complete and unambiguous enough for an implementer to begin without seeking clarification
**Created**: 2026-06-04
**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md) · [tasks.md](../tasks.md)
**Audience**: Implementer (self-review before coding begins)
**Depth**: Standard

---

## Requirement Completeness

- [x] CHK001 — Is the `submitGuess` auto-end side-effect (status → `"ended"`, `revealedWord` set) documented in `contracts/api.md` for `POST /rooms/:code/guesses`, or only in `data-model.md`? [Completeness, Gap]
- [x] CHK002 — Is "no further guesses accepted once status is `"ended"`" specified as an explicit requirement with an expected error code (409), or only implied by the existing status guard in `submitGuess`? [Completeness, Gap]
- [x] CHK003 — Is `roundNumber` defined with its type, initial value, and increment logic in `data-model.md` or `spec.md`? It appears in FR-005's reset list but is absent from the `Room` interface in `data-model.md`. [Completeness, Spec §FR-005, Gap]
- [x] CHK004 — Does `contracts/api.md` include the `GET /rooms/:code` response shape for `status === "ended"`, or only the two new `POST` endpoints? [Completeness, contracts/api.md, Gap]
- [x] CHK005 — Is the `participantId` source (how `GamePage` and `ResultPage` read the current user's ID for host-check rendering) specified in the plan or spec, or assumed from existing page implementations? [Completeness, plan.md, Gap]

---

## Requirement Clarity

- [x] CHK006 — Is FR-014 updated in `spec.md` to include "ranked by score (descending)", or is this precision only present in the task description (T013)? [Clarity, Spec §FR-014]
- [x] CHK007 — Is the `revealedWord` absent-fallback display value (e.g., `"(unknown)"`) documented in `spec.md` or `contracts/api.md`, or only in the T013 task description? [Clarity, Gap]
- [x] CHK008 — Is the FR-009 validation order (host-identity check before or after status check in `endRound`/`restartRoom`) explicitly specified, or left to implementer judgment? [Clarity, Spec §FR-009, data-model.md §Service Contracts]
- [x] CHK009 — Is the post-restart navigation behavior (poll detects `"lobby"` → navigate to `/lobby`) in `ResultPage` specified as a requirement in `spec.md` (FR-013), or only described as a task-level implementation note in T013? [Clarity, Spec §FR-013]

---

## Acceptance Criteria Quality

- [x] CHK010 — Are SC-001 and SC-002 (≤2 s transition for all participants) tied to a verifiable test path (e.g., quickstart.md steps), or only stated as high-level success criteria without a concrete acceptance procedure? [Acceptance Criteria, Spec §SC-001, SC-002]
- [x] CHK011 — Does SC-005 ("100% of unauthorized attempts rejected") define the expected error format (HTTP status code + body structure), or only the status outcome? [Clarity, Spec §SC-005]

---

## Scenario Coverage

- [x] CHK012 — Is the navigation fallback for a participant who opens `/result` directly via deeplink (no room in the frontend store) a specified requirement, or an implementer-defined behavior? [Coverage, Spec Edge Cases]
- [x] CHK013 — Is the error handling behavior for the "Restart Game" / "End Round" button on API failure (network error, 403/409 response) specified as a requirement, or covered only by the general constitution Principle IV? [Coverage, Gap]
- [x] CHK014 — Are requirements defined for the reconnect scenario: a participant who was in `"playing"` status, disconnects, and reconnects during `"ended"` — does the poll-driven navigation handle this case, and is it specified? [Coverage, Spec Edge Cases]

---

## Non-Functional Requirements

- [x] CHK015 — Is the 2-second polling interval for `ResultPage` explicitly required in the spec or plan, or only assumed by analogy to `GamePage`? [Completeness, Spec §Assumptions]
- [x] CHK016 — Are `setInterval` cleanup requirements (clear on unmount) explicitly required for `ResultPage` in the plan or spec, or only implied by the general constitution Principle III? [Completeness, Constitution §III]

---

## Assumptions & Dependencies

- [x] CHK017 — Is the `RoomStore` pattern requirement (write operations go through `roomStore.ts` wrappers, not `api.*` directly) documented in `plan.md`'s Technical Context or Source File list, or only reflected in the tasks (T023, T024) added during analysis? [Consistency, plan.md, tasks.md]
- [x] CHK018 — Is the race condition resolution policy (Node.js single-threaded; first write wins; second call gets 409) documented as an explicit architectural constraint in the spec or a referenced artifact, such that an implementer does not need to re-derive it? [Assumption, research.md §2]
