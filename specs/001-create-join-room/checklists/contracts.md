# Specification Quality Checklist: API Contracts & Data Model

**Purpose**: Validate the completeness, clarity, and consistency of API contract and data-model requirements against the feature specification
**Created**: 2026-06-11
**Feature**: [spec.md](../spec.md)
**Coverage**: contracts/api.md, data-model.md, and their alignment with functional requirements

---

## Contract Completeness

- [ ] **CHK001** — Every functional requirement (FR-001 through FR-010) is traceable to at least one endpoint, request/response schema, or data-model validation rule.
- [ ] **CHK002** — Each endpoint in contracts/api.md documents a complete request schema, success response schema, and all possible error responses.
- [ ] **CHK003** — The player leave / participant removal mechanism (required for host transfer and empty-room cleanup) is explicitly documented as an endpoint or lifecycle event.
- [ ] **CHK004** — The `GET /rooms/:code` endpoint explicitly documents its role in the ~2s HTTP polling mechanism, including whether caching or rate-limiting behavior is specified.

---

## Contract Clarity

- [ ] **CHK005** — The purpose of `participantId` (identity proof vs. viewer context) is unambiguous across all endpoints and consistent with Clarification #4.
- [ ] **CHK006** — HTTP status code trigger conditions (400, 403, 404, 409) are unambiguous and non-overlapping for every endpoint; a single malformed input does not map to multiple possible codes.
- [ ] **CHK007** — Error message content is exemplified or templated in contracts/api.md so that "clear, user-facing error message" (FR-005, FR-006) is objectively verifiable during testing.

---

## Contract Consistency

- [ ] **CHK008** — `participantId` is passed consistently across endpoints (query param for GET, body for POST) and the rationale for the transport mismatch is documented.
- [ ] **CHK009** — `RoomSnapshot` fields declared in data-model.md exactly match the response examples in contracts/api.md with no undocumented or missing fields.
- [ ] **CHK010** — Data-model validation rules (data-model.md § Validation Rules) are consistent with the Zod schema constraints described in contracts/api.md and plan.md.

---

## Edge Case & Exception Coverage in Contracts

- [ ] **CHK011** — Host transfer on participant leave (FIFO) is covered by an endpoint or explicit lifecycle documentation, not only described in the clarifications table.
- [ ] **CHK012** — Empty-room immediate deletion and 10-minute idle cleanup are documented as server-side behaviors with observable triggers (e.g., event, timer, or endpoint side-effect).
- [ ] **CHK013** — Rejection of new joiners when `status === "playing"` (Clarification #3) returns a specific, documented error response with a verifiable message pattern.
- [ ] **CHK014** — Duplicate player names within a room have documented contract behavior (allowed, no disambiguation required) that aligns with the assumptions in spec.md.

---

## Data Model Gaps

- [ ] **CHK015** — If `roles` appears in `RoomSnapshot`, the `ParticipantRole` entity or type is defined in data-model.md with at least one example value.
- [ ] **CHK016** — Forward-looking fields in `RoomSnapshot` (`availableWords`, `roles`) are justified in scope or explicitly marked as reserved for future features, given the single-round constraint.

---

## Findings

<!-- Add any issues or observations discovered during checklist review -->

-

## Approval

- [ ] Checklist reviewed — contract and data-model quality validated
- [ ] Checklist requires revision before planning

**Reviewer**: ________________
**Date**: ________________
