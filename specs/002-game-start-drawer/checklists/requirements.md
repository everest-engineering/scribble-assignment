# Specification Quality Checklist: Game Start & Drawer Flow

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-06-10
**Feature**: [spec.md](../spec.md)

## Content Quality

- [X] No implementation details (languages, frameworks, APIs) — spec talks in terms of "snapshot", "payload", "drawer", not Express/React/Zod.
- [X] Focused on user value and business needs — every FR ties back to "what the player sees" or "what the game guarantees".
- [X] Written for non-technical stakeholders — uses gameplay language; ParticipantView/Round names are domain terms, not framework constructs.
- [X] All mandatory sections completed — User Scenarios, Requirements, Success Criteria, Assumptions.

## Requirement Completeness

- [X] No [NEEDS CLARIFICATION] markers remain.
- [X] Requirements are testable and unambiguous — every FR is verifiable via a snapshot inspection or a UI assertion.
- [X] Success criteria are measurable — counts, ratios, and timing thresholds throughout SC-001..SC-005.
- [X] Success criteria are technology-agnostic — phrased as "the UI shows X" / "payload includes Y", no framework names.
- [X] All acceptance scenarios are defined — each US has Given/When/Then scenarios.
- [X] Edge cases are identified — double-start, late join, empty word list, whitespace names, 2-player floor.
- [X] Scope is clearly bounded — Round 1 only; round-end, scoring, drawing, guessing all explicitly deferred.
- [X] Dependencies and assumptions identified — Assumptions section enumerates starter list, polling carry-over, no auth, no late-join handling.

## Feature Readiness

- [X] All functional requirements have clear acceptance criteria — each FR maps to an SC or a US scenario.
- [X] User scenarios cover primary flows — drawer assignment (US1), word visibility (US2), determinism (US3).
- [X] Feature meets measurable outcomes defined in Success Criteria — SC-001..SC-005 cover transition, determinism, leakage, idempotency, and drawer-only visibility.
- [X] No implementation details leak into specification — no mention of Express, React, Zod, useEffect, sessionStorage as required tooling (sessionStorage mention is in Assumptions only, as a carry-over fact from Scenario 1).

## Notes

- Item carried forward from Scenario 1: player-name trimming and non-empty validation. Re-stated as FR-009 (non-regression) rather than re-derived.
- Word selection rule chosen as `availableWords[(N-1) mod N]` to maximise determinism with the existing 5-word starter list. This trivially yields "rocket" for round 1. Plan phase can revisit if a richer scheme is desired.
- "Host" and "first player" are the same participant by Scenario 1's design; spec treats them as one role to avoid duplicative requirements.
- Late join during an active round is **explicitly out of scope**. Plan should not introduce code paths for it unless a separate scenario asks.
