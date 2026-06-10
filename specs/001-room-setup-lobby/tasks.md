---
description: "Task list for Room Setup & Lobby"
---

# Tasks: Room Setup & Lobby

**Input**: Design documents in `specs/001-room-setup-lobby/`

**Prerequisites**: `plan.md`, `spec.md` (required), `research.md`, `data-model.md`, `contracts/rooms-api.md`, `quickstart.md`.

**Tests**: Included. The constitution mandates tests for spec-mandated behavior (validation, host gating, isolation, polling cadence). Existing Vitest scaffolding (`roomStore.test.ts`, `schemas.test.ts`, `api.test.ts`) is the convention; new tests are colocated.

**Branch**: All work lands on `scribble-lab` (no separate feature branch for this lab).

**Organization**: Tasks are grouped by user story (US1–US4) per `spec.md`. The MVP is **US1 + US2** (Create + Join); US3 (polling) and US4 (host-gated Start) layer on top.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable — different file, no in-flight dependency.
- **[Story]**: User-story tag inside US phases only.
- Every task names exact file paths.

## Path Conventions

- Backend code: `backend/src/...`; tests colocated as `*.test.ts`.
- Frontend code: `frontend/src/...`; tests colocated as `*.test.{ts,tsx}`.

---

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Create `frontend/src/hooks/` directory with an empty `frontend/src/hooks/.gitkeep` so the new polling hook has a home.
- [X] T002 [P] Verify both dev servers boot cleanly (`npm run dev` in `backend/` and `frontend/`) and `curl http://localhost:3001/health` returns `{"ok":true}`. No code change unless something is broken.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Reshape the room/participant model and snapshot so every user story can rely on host identity and viewer-aware fields. **No US-tagged work may start until this phase is green.**

- [X] T003 Extend `backend/src/models/game.ts`: add `hostParticipantId: string` to `Room`; add `ParticipantView extends Participant { isHost: boolean }`; extend `RoomSnapshot` with `hostParticipantId: string`, `viewerIsHost: boolean`, `canStart: boolean`, and switch its `participants` field to `ParticipantView[]`.
- [X] T004 Update `backend/src/services/roomStore.ts` so `createRoom` records `hostParticipantId` (= the creator's `participant.id`); change `getRoom`/`joinRoom` to look up via the uppercased trimmed code; update `toRoomSnapshot(room, viewerParticipantId)` to derive `viewerIsHost`, `canStart` (`viewerIsHost && participants.length >= 2`), `hostParticipantId`, and per-participant `isHost`.
- [X] T005 Tighten Zod schemas in `backend/src/api/schemas.ts`: `playerName` becomes `z.string().trim().min(1).max(24)` (required, no default); `roomCodeParamsSchema.code` becomes `z.string().trim().min(1).transform(s => s.toUpperCase())`; add `startRoomSchema = z.object({ participantId: z.string().min(1) })`.
- [X] T006 [P] Mirror the snapshot shape on the client by updating `Participant`, `RoomSnapshot`, and `RoomSessionResponse` interfaces in `frontend/src/services/api.ts` (add `isHost` to `Participant`; add `hostParticipantId`, `viewerIsHost`, `canStart` to `RoomSnapshot`).
- [X] T007 Update `backend/src/services/roomStore.test.ts` to assert that `createRoom` sets `hostParticipantId` to the creator's id and that `toRoomSnapshot` returns `viewerIsHost: true` only for the host id and `false` otherwise (red → green to confirm T004).

**Checkpoint**: All snapshots returned by the backend carry host/viewer info; frontend types match. User story phases can begin.

---

## Phase 3: User Story 1 - Create a private room as host (Priority: P1) 🎯 MVP

**Goal**: A new player creates a room with a non-empty name, lands in the lobby with a unique code, and is recognized as the host.

**Independent Test**: `POST /rooms` with `{"playerName":"Alice"}` returns 201 with `viewerIsHost: true` and `participants[0].isHost: true`; the frontend Create flow shows the lobby with the host badge and a disabled Start button.

### Tests for User Story 1

- [X] T008 [P] [US1] Add Vitest cases in `backend/src/api/schemas.test.ts` asserting `createRoomSchema` rejects empty/whitespace/missing `playerName` and accepts a trimmed valid name.
- [X] T009 [P] [US1] Add Vitest cases in `backend/src/services/roomStore.test.ts` covering: created room has unique 4-char code, creator is the only participant, `hostParticipantId === participants[0].id`, and `toRoomSnapshot` for the creator reports `viewerIsHost: true` with `canStart: false`.
- [X] T010 [P] [US1] Add Vitest cases in `frontend/src/pages/CreateRoomPage.helpers.test.ts` (new file) for a pure-function `isCreateFormValid(playerName: string): boolean` exported from `frontend/src/pages/CreateRoomPage.tsx`: false for empty / whitespace-only, true for trimmed non-empty up to 24 chars.

### Implementation for User Story 1

- [X] T011 [US1] In `backend/src/api/rooms.ts`, ensure `POST /` returns 201 with the snapshot derived from the updated `toRoomSnapshot` (Phase 2 wiring) and that the response surfaces the new fields.
- [X] T012 [US1] In `frontend/src/pages/CreateRoomPage.tsx`, export `isCreateFormValid`; trim `playerName` before submit; disable the submit button when invalid; surface server validation errors inline; do not send `participantId` (creator id is in the response).
- [X] T013 [US1] In `frontend/src/state/roomStore.ts`, persist `participantId` and `room.code` to `sessionStorage` inside `setRoomSession`; expose a `viewerIsHost` boolean on the public state derived from the latest snapshot.
- [X] T014 [US1] In `frontend/src/pages/LobbyPage.tsx`, render a "Host" badge on the participant whose `isHost === true` and gate the Start Game button visibility on `room.viewerIsHost` (button still disabled — enablement comes in US4).

**Checkpoint**: One-tab create flow works end-to-end; quickstart Scenario 1 passes.

---

## Phase 4: User Story 2 - Join an existing room with a code (Priority: P1)

**Goal**: A second player can join with a non-empty name and a valid code, sees the same lobby, and is **not** treated as the host. Empty/invalid codes are rejected with clear messages.

**Independent Test**: With a room created in US1, `POST /rooms/abcd/join` (lowercase + whitespace) and `POST /rooms/ABCD/join` resolve to the same room; an empty code is blocked client-side; an unknown code returns 404 with `{"message":"Room not found"}` and the join page shows that text inline.

### Tests for User Story 2

- [X] T015 [P] [US2] Add Vitest cases in `backend/src/services/roomStore.test.ts` covering: `joinRoom` finds a room by code regardless of case/whitespace, returns `null` for unknown codes, appends a non-host participant whose snapshot shows `viewerIsHost: false`, and that two distinct rooms never share participants (covers FR-008 / SC-006).
- [X] T016 [P] [US2] Add Vitest cases in `backend/src/api/schemas.test.ts` for `roomCodeParamsSchema` rejecting empty/whitespace `code` and uppercasing valid input.
- [X] T017 [P] [US2] Add a Vitest case in `frontend/src/services/api.test.ts` asserting `api.joinRoom` URL-encodes the code and that a 404 response surfaces the server's `message` ("Room not found") via the thrown error.
- [X] T018 [P] [US2] Add Vitest cases in `frontend/src/pages/JoinRoomPage.helpers.test.ts` (new file) for a pure-function `isJoinFormValid(playerName: string, roomCode: string): boolean` exported from `frontend/src/pages/JoinRoomPage.tsx`: false when either is empty/whitespace, true otherwise.

### Implementation for User Story 2

- [X] T019 [US2] In `backend/src/services/roomStore.ts`, defense-in-depth: have `getRoom`/`joinRoom` uppercase any inbound code before `Map` lookup (the route schema already normalizes via T005).
- [X] T020 [US2] In `backend/src/api/rooms.ts`, ensure both `POST /:code/join` and `GET /:code` return `404 { "message": "Room not found" }` (not the previous "Unable to join/load room" wording) per FR-006.
- [X] T021 [US2] In `frontend/src/pages/JoinRoomPage.tsx`, export `isJoinFormValid`; trim both inputs; disable submit when invalid; on success route to `/lobby`; on error display the thrown message inline (no redirect).
- [X] T022 [US2] In `frontend/src/services/api.ts`, when the response is non-OK, propagate the server's `message` field unchanged so callers can show "Room not found" without translation.

**Checkpoint**: Two-tab create-then-join flow renders both players in the lobby; quickstart Scenarios 2 and 5 pass. **MVP is now complete.**

---

## Phase 5: User Story 3 - Lobby stays in sync automatically (Priority: P2)

**Goal**: Lobby participants update on their own approximately every 2 seconds via HTTP polling; transient errors don't blank the list; polling stops on unmount and on 404. Refreshing the lobby page does not bounce the user home.

**Independent Test**: Open the lobby in two clients; have a third client join; both existing clients show the new participant within ~2s without clicking anything. Hitting browser refresh on `/lobby` keeps the user on the lobby with the same room rehydrated.

### Tests for User Story 3

- [X] T023 [P] [US3] Add Vitest cases in `frontend/src/hooks/useLobbyPolling.test.ts` (new file) using fake timers to verify: an immediate fetch on mount, an additional fetch every ~2000 ms while visible, no fetches while `document.visibilityState === "hidden"`, an immediate fetch on returning to visible, and no fetches after unmount.
- [X] T024 [P] [US3] Add Vitest cases in `frontend/src/state/roomStore.test.ts` (new file) verifying that on construction the store rehydrates `participantId` and `room.code` from `sessionStorage` if present, and that a 404 from `fetchRoom` clears the room and stops further polling without throwing past the boundary.

### Implementation for User Story 3

- [X] T025 [US3] Create `frontend/src/hooks/useLobbyPolling.ts` exporting `useLobbyPolling(code: string | null, participantId: string | null, intervalMs = 2000)` that calls `roomStore.fetchRoom()` on mount and on each interval tick, pauses on `visibilitychange` when hidden, resumes with an immediate fetch when visible, and clears the interval and listener on unmount.
- [X] T026 [US3] In `frontend/src/state/roomStore.ts`, on store construction read `participantId` and `code` from `sessionStorage` and pre-populate state with a "shell" room (`code` only) so `LobbyPage` does not redirect before the first poll completes; clear `sessionStorage` on a 404 from `fetchRoom`.
- [X] T027 [US3] In `frontend/src/pages/LobbyPage.tsx`, replace the manual Refresh button with `useLobbyPolling(room?.code ?? null, participantId)`, remove the `useEffect` that navigates to `/` when `room` is null on first render, and surface a "Room no longer available" state with a link back to `/` when polling has been stopped due to 404.
- [X] T028 [US3] In `frontend/src/state/roomStore.ts`, ensure `fetchRoom` swallows transient (non-404) errors by setting `error` without clearing the last known `room`, satisfying FR-012.

**Checkpoint**: Quickstart Scenarios 3 and 6 pass; the manual Refresh button is gone.

---

## Phase 6: User Story 4 - Host starts the game when ready (Priority: P2)

**Goal**: Only the host sees Start Game; it is disabled until ≥2 participants are present; non-host or under-strength start requests are rejected by the server.

**Independent Test**: With two participants, the host's UI shows an enabled Start button and the non-host's UI does not show it. `curl POST /rooms/:code/start` as a non-host returns 403; as the host with one participant returns 409; as the host with two participants returns 200.

### Tests for User Story 4

- [X] T029 [P] [US4] Add Vitest cases in `backend/src/services/roomStore.test.ts` for `startRoom(code, requesterId)`: returns an "ok" outcome only when `requesterId === hostParticipantId` and `participants.length >= 2`; otherwise returns a typed reason (`"not_found" | "not_host" | "not_enough_players"`).
- [X] T030 [P] [US4] Add Vitest cases in `backend/src/api/rooms.test.ts` (new file) covering `POST /rooms/:code/start` returning 200/403/404/409 per `specs/001-room-setup-lobby/contracts/rooms-api.md`. Use `supertest`-free approach by importing `createApp()` and exercising the express app directly via `node:http` if needed, or simply unit-test the handler around `roomStore`.
- [X] T031 [P] [US4] Add Vitest cases in `frontend/src/pages/LobbyPage.helpers.test.ts` (new file) for a pure-function `getStartButtonState(room): { visible: boolean; disabled: boolean }` exported from `frontend/src/pages/LobbyPage.tsx`: hidden when `viewerIsHost === false`; visible+disabled when `viewerIsHost && participants.length < 2`; visible+enabled when `canStart === true`.

### Implementation for User Story 4

- [X] T032 [US4] In `backend/src/services/roomStore.ts`, add `startRoom(code, requesterId)` returning the discriminated outcome from T029. Do not mutate `status` (gameplay is out of scope) but refresh `updatedAt` on success.
- [X] T033 [US4] In `backend/src/api/rooms.ts`, add `POST /:code/start` that parses `startRoomSchema`, calls `startRoom`, and maps outcomes to 200 / 403 (`Only the host can start the game`) / 404 (`Room not found`) / 409 (`Need at least 2 players to start`) per the contract.
- [X] T034 [US4] In `frontend/src/services/api.ts`, add `api.startRoom(code, participantId)` returning `{ room: RoomSnapshot }` and propagating the server `message` on error.
- [X] T035 [US4] In `frontend/src/pages/LobbyPage.tsx`, export `getStartButtonState`; render the Start Game button only when visible; set its `disabled` from the helper; on click call `api.startRoom`; surface 403/409 messages inline (gameplay route remains the existing placeholder).

**Checkpoint**: Quickstart Scenario 4 passes end-to-end; FR-014–FR-017 are server-enforced.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T036 [P] Update `README.md` "Current Implementation" section so "host behavior or host-only permissions" and "automatic lobby polling" move from "Not implemented yet" to "Implemented today".
- [ ] T037 [P] Run the full quickstart from `specs/001-room-setup-lobby/quickstart.md` against a clean backend and capture any deviations as follow-up notes in `specs/001-room-setup-lobby/checklists/requirements.md` Notes.
- [X] T038 Run `npm test` in both `backend/` and `frontend/` and ensure all suites pass; widen fake-timer tolerances in `useLobbyPolling.test.ts` if flakiness appears, but never relax behavioral assertions.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on Phase 1; **blocks every user story**.
- **US1 (Phase 3)** and **US2 (Phase 4)**: both depend only on Phase 2. US1 is the natural MVP starting point.
- **US3 (Phase 5)**: depends on Phase 2; benefits from US1+US2 being merged so polling has something meaningful to render.
- **US4 (Phase 6)**: depends on Phase 2 and on US1 (host identity) + US2 (a second player to satisfy the ≥2 gate end-to-end).
- **Polish (Phase 7)**: after the user stories you intend to ship.

### User Story Dependencies

- US1 ⟂ US2 (independent given Phase 2). Both are P1 and combine into the MVP.
- US3 builds on the lobby surface introduced by US1/US2 but is otherwise independent.
- US4 depends on the host designation from US1 and a meaningful >1-player lobby from US2.

### Within Each User Story

- Test tasks are written first and observed failing before the matching implementation task (TDD per Constitution Principle V).
- Backend model/schema changes precede backend route changes, which precede frontend wiring.
- No two tasks in the same story should mutate the same file in parallel (the [P] marker enforces this).

### Parallel Opportunities

- T006 runs in parallel with T003–T005 (different file).
- All tests inside a single user story marked [P] (T008–T010, T015–T018, T029–T031) can be authored in parallel.
- US1 and US2 implementation tasks can be split across two developers once Phase 2 is merged.
- T036 and T037 in Polish can run in parallel; T038 must run last.

---

## Parallel Example: User Story 2

```bash
# Author all US2 tests in parallel:
Task: "Add roomStore.test.ts cases for case-insensitive join + isolation"
Task: "Add schemas.test.ts cases for empty/whitespace code"
Task: "Add api.test.ts case for 404 message propagation"
Task: "Add JoinRoomPage.helpers.test.ts case for isJoinFormValid"
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Phase 1 → Phase 2 → US1 → US2.
2. Stop, run quickstart Scenarios 1, 2, 5. Demoable two-tab flow.

### Incremental Delivery

1. Ship MVP (US1 + US2) and validate against the spec.
2. Add US3 (polling) — removes manual refresh, satisfies SC-003.
3. Add US4 (host-gated Start) — closes the lobby phase.
4. Run Polish (Phase 7) and re-run the full quickstart.

### Parallel Team Strategy

- One engineer drives Phase 2 to merge.
- After merge: Engineer A picks up US1, Engineer B picks up US2 in parallel.
- Once both are green: Engineer A → US3, Engineer B → US4, in parallel.
- Single engineer runs Phase 7.

---

## Notes

- Every task lists exact file paths; no task is "update the codebase".
- [P] is reserved for tasks that genuinely touch separate files and have no in-flight dependency.
- MVP scope is **Phase 1 → Phase 2 → US1 → US2 (T001–T022)**.
- Do not skip the foundational phase. The host/snapshot fields are the contract every later phase depends on.
- After each story checkpoint, commit and re-run the matching quickstart scenario.
