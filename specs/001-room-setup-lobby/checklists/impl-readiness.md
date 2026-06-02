# Pre-Implementation Readiness Checklist: Room Setup & Lobby

**Purpose**: Author sanity check — validate that requirements are complete, clear, and consistent enough to begin coding across all layers (backend model, API contracts, frontend UX, polling, and validation).
**Created**: 2026-06-03
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [tasks.md](../tasks.md)
**Depth**: Lightweight (author, pre-implementation)
**Emphasis**: Extra coverage on boundary validation, error handling, and Constitution IV compliance

---

## Data Model Requirements

- [x] CHK001 - Are the data type, immutability, and initialization point of `hostId` explicitly specified — i.e., it is a `string`, set exactly once in `createRoom()`, and never mutated? [Completeness, Spec §FR-2, data-model.md]
- [x] CHK002 - Is the `"playing"` → `"lobby"` reverse transition explicitly excluded from scope, so an implementer will not speculatively add a reset path? [Clarity, data-model.md §State Transitions]
- [x] CHK003 - Is `RoomSnapshot.hostId` specified as a required (non-optional) field in every API response that returns a snapshot — create, join, get, and start? [Completeness, contracts/rooms-api.md, Spec §FR-2]

---

## API Contract Requirements

- [x] CHK004 - Are HTTP status codes specified for all success **and** error paths on every endpoint — including the new `POST /rooms/:code/start` (200 success, 404 unknown room)? [Completeness, contracts/rooms-api.md]
- [x] CHK005 - Is the `GET /rooms/:code` response shape confirmed as `{ "room": RoomSnapshot }` (wrapped) consistently across the backend handler, contracts doc, and frontend `api.ts` type — after the D1 fix? [Consistency, contracts/rooms-api.md §GET, backend/src/api/rooms.ts]
- [x] CHK006 - Is the `participantId` query parameter on `GET /rooms/:code` documented as optional (not required), matching the backend `roomViewerQuerySchema` behaviour? [Clarity, contracts/rooms-api.md §GET]

---

## Validation & Error Handling ⚠️ Constitution IV — Extra Coverage

- [x] CHK007 - Is it specified that `POST /rooms/:code/start` accepts an empty body (no fields required), and that no Zod coercion or field validation is needed beyond the route param? [Completeness, Spec §FR-8, Clarification Q2, tasks.md:T010]
- [x] CHK008 - Is the exact 409 error message string `"Game already in progress"` locked as a contractual constant — not merely illustrative — so both the backend and frontend test against the same string? [Clarity, Spec §FR-10, contracts/rooms-api.md §POST join]
- [x] CHK009 - Is the exact 404 error message string for an unknown room code specified as a contract, so UI copy matches the backend response? [Clarity, Spec §FR-5, contracts/rooms-api.md]
- [x] CHK010 - Are client-side pre-API validation requirements specified for an **empty or whitespace-only player name** on the **Create Room form** — including the exact feedback message and the requirement that no API call is made? [Completeness, Spec §FR-1, Spec §US1-AC3, tasks.md:T018]
- [x] CHK011 - Are client-side pre-API validation requirements specified for an **empty or whitespace-only player name** on the **Join Room form** — same constraints as CHK010? [Completeness, Spec §FR-1, Spec §US2-AC2, tasks.md:T008]
- [x] CHK012 - Are client-side pre-API validation requirements specified for an **empty or whitespace-only room code** on the Join Room form — including the exact feedback message and the requirement that no API call is made? [Completeness, Spec §FR-1, Spec §US2-AC4, tasks.md:T008]

---

## Polling Behaviour Requirements

- [x] CHK013 - Is the polling interval specified as a fixed constant of 2000 ms — not configurable, not subject to back-off — so an implementer does not introduce a dynamic value? [Clarity, Spec §FR-6, Spec §Assumption 5]
- [x] CHK014 - Is "single failure → redirect immediately" unambiguously specified with no distinction between network error and non-OK HTTP response — both must trigger the same redirect-to-`/` path? [Clarity, Spec §FR-6, Spec §Clarification Q1]
- [x] CHK015 - Is the redirect destination on poll failure specified as `/` (the start/root route) rather than a different fallback such as `/join`? [Clarity, Spec §FR-6]
- [x] CHK016 - Is the interval cleanup requirement stated as a hard constraint (not advisory), covering both normal unmount and the failure-redirect path — so an implementer cannot leave an open `setInterval` after navigation? [Completeness, Spec §FR-6, Constitution §III]

---

## Host Gating Requirements

- [x] CHK017 - Is the host-identity check specified as the exact comparison `participantId === room.hostId` (not role-based, not index `participants[0]`, not a boolean field on the participant)? [Clarity, Spec §FR-7, data-model.md]
- [x] CHK018 - Is the minimum participant threshold for enabling "Start Game" defined as `participants.length >= 2` (not `> 1`, not `>= 3`), and is this requirement stated explicitly rather than implied? [Clarity, Spec §FR-7, Spec §US4-AC1, tasks.md:T015]
- [x] CHK019 - Are requirements specified for the disabled-state user feedback (tooltip or helper text) when the host sees the "Start Game" button disabled — so it is clear to the host why they cannot start yet? [Completeness, Spec §US4-AC1]

---

## State Transitions & Edge Cases

- [x] CHK020 - Is the behaviour of `POST /rooms/:code/start` when the room is **already** in `"playing"` status specified — idempotent, error response, or silently accepted — so an implementer does not need to guess? [Edge Case, data-model.md §State Transitions, Gap]
- [x] CHK021 - Are the two distinct navigation paths after start clearly specified: the **host navigates immediately** on `startRoom()` resolution, while **guests navigate via polling** detecting `status: "playing"` — so both paths are tested independently? [Completeness, Spec §FR-9, Spec §US4-AC4]
- [x] CHK022 - Is the frontend error behaviour for a failed `startRoom()` call (e.g. a 404 race condition between host clicking start and the room disappearing) specified — does the UI surface an error or silently absorb it? [Edge Case, Gap]
