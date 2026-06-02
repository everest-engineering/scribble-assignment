# Implementation Plan: Game Start and Drawer Flow

**Branch**: `002-game-start-drawer` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-game-start-drawer/spec.md`

## Summary

Extend the existing room setup implementation so starting a room creates the first playing round. The backend will keep round state in memory on the `Room`, assign a deterministic drawer, choose a deterministic starter word, and return viewer-specific room snapshots that reveal the secret word only to the drawer. The frontend will carry the expanded snapshot through the existing room store and update the game screen to show drawer identity, drawer-only word visibility, and guesser-safe state.

## Technical Context

**Language/Version**: TypeScript 5.6, Node.js backend, React 18 frontend, ES Modules.

**Primary Dependencies**: Express, Zod, React, React Router, Vite, Vitest, existing Context/external-store room state.

**Storage**: In-memory backend room state only; current round lives on the active room object.

**Testing**: Backend Vitest tests for room service, API routes, and schemas; frontend Vitest tests for API service; backend/frontend TypeScript builds; manual two-tab drawer/guesser validation.

**Target Platform**: Local browser clients plus local Node.js backend.

**Project Type**: Web app: React frontend plus Express backend.

**Performance Goals**: Room start completes on first valid host attempt; playing-state refresh shows drawer identity within the existing polling window; secret word is never present in guesser snapshots.

**Constraints**: HTTP polling only, in-memory state, no authentication, no sessions, no databases, no WebSockets or push protocols, no unrelated refactors.

**Scale/Scope**: Feature Group 2 only: first-round start, drawer assignment, deterministic starter-word selection, viewer-specific secret visibility, game screen display, and validation.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Brownfield Extension**: PASS. Extend current Feature Group 1 files: `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`, `backend/src/api/rooms.ts`, `frontend/src/services/api.ts`, `frontend/src/state/roomStore.ts`, and `frontend/src/pages/GamePage.tsx`.
- **Full-Stack Input Validation**: PASS. Player-name validation already exists and will remain covered; start/game-state access validates room code, participant ID, room status, player membership, and role before returning role-specific data.
- **Polling-Only Synchronization**: PASS. Continue using HTTP fetch/polling only through the existing room fetch path; no push protocols are introduced.
- **Simple Implementation**: PASS. Current round state is stored directly on the in-memory room with no database, auth, session, new state library, or extra infrastructure.
- **Specification Traceability**: PASS. Changes map to US1-US4 and FR-001 through FR-019 from `spec.md`.
- **Human Review of AI Output**: PASS. Quickstart includes code review, test/build checks, and two-tab drawer/guesser validation before acceptance.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/game.ts
│   ├── seed/starterData.ts
│   ├── services/roomStore.ts
│   ├── services/roomStore.test.ts
│   ├── api/schemas.ts
│   ├── api/schemas.test.ts
│   ├── api/rooms.ts
│   └── api/rooms.test.ts

frontend/
├── src/
│   ├── services/api.ts
│   ├── services/api.test.ts
│   ├── state/roomStore.ts
│   ├── pages/GamePage.tsx
│   └── styles/app.css
```

**Structure Decision**: Use the existing web application split and keep all state transitions in the backend room service. The frontend consumes snapshots and renders role-specific views without duplicating secret-word rules.

## Complexity Tracking

No constitution violations.

## Phase 0: Research Summary

Detailed decisions are captured in [research.md](./research.md).

- Store `currentRound` directly on each active in-memory room.
- Use the current host as drawer when valid, otherwise fall back to earliest joined participant.
- Select the first secret word deterministically from the ordered starter word list using a stable room-derived index.
- Return viewer-specific snapshots from the existing room fetch/start responses, omitting `secretWord` entirely for guessers.

## Phase 1: Design Summary

### Backend Model Changes

- Extend `RoomStatus` naming to represent lobby and playing states consistently.
- Add `CurrentRound` with round number, drawer participant ID, selected word, and started timestamp.
- Add public snapshot fields for current round number, drawer identity, viewer role, and whether the viewer is drawer.
- Add optional drawer-only `secretWord` to the snapshot, present only when the viewer is the drawer.

### Room State Updates

- `startRoom` remains the single state transition from lobby to playing.
- On successful start, the room gets `currentRound` populated exactly once for the first round.
- Failed start attempts leave `status`, drawer, and secret word unchanged.
- Join attempts continue to be rejected once the room is no longer in lobby state.

### Drawer Assignment Logic

- If `hostParticipantId` matches a current participant, use that participant as drawer.
- If the host reference is missing or stale, sort/scan participants by join order and choose the earliest joined participant.
- Reject start if no valid drawer can be selected.

### Deterministic Word Selection Strategy

- Use the ordered starter word list from `backend/src/seed/starterData.ts`.
- Select the first-round word with a deterministic room-derived index, such as a stable checksum of the room code modulo the word count.
- Reject start with a clear validation error if the word list is empty.
- Persist the selected word on `currentRound` so refreshes return the same word.

### Viewer-Specific Room Snapshots

- `toRoomSnapshot(room, viewerParticipantId)` becomes the privacy boundary.
- Public snapshot fields include drawer identity and round status for all players.
- Drawer snapshots include `secretWord`.
- Guesser snapshots omit the `secretWord` property entirely.
- Unknown or missing viewers never receive drawer-only fields.

### API Changes

- `POST /rooms/:code/start`: preserve host/minimum-player validation, add first-round creation, and return a viewer-specific snapshot for the starter.
- `GET /rooms/:code?participantId=...`: return viewer-specific playing snapshots, including drawer-only word visibility when appropriate.
- Existing create/join validation remains in place for trimmed names and lobby-only joins.

### Frontend State Changes

- Extend `RoomSnapshot` type with `currentRound`, `drawerParticipantId`, `viewerRole`, `isDrawer`, and optional `secretWord`.
- Keep `RoomStore` as the single client-side source of current room snapshot and participant ID.
- Ensure `fetchRoom` keeps using `participantId` so the backend can derive viewer-specific word visibility.

### Game Screen Updates

- `GamePage` displays the drawer's name to all players.
- Drawer view shows the secret word clearly.
- Guesser view shows instructions such as "Watch the drawer and guess the word" without storing or rendering the secret word.
- If a player reaches the game page before the room is playing, redirect or show a safe waiting state without leaking private data.

### Files Affected

- `backend/src/models/game.ts`
- `backend/src/seed/starterData.ts`
- `backend/src/services/roomStore.ts`
- `backend/src/services/roomStore.test.ts`
- `backend/src/api/schemas.ts`
- `backend/src/api/schemas.test.ts`
- `backend/src/api/rooms.ts`
- `backend/src/api/rooms.test.ts`
- `frontend/src/services/api.ts`
- `frontend/src/services/api.test.ts`
- `frontend/src/state/roomStore.ts`
- `frontend/src/pages/GamePage.tsx`
- `frontend/src/styles/app.css`

### Testing Strategy

- Backend service tests for drawer assignment, host fallback, deterministic word selection, word persistence, empty word list rejection, and guesser-safe snapshots.
- Backend API tests comparing drawer versus guesser responses for `POST /rooms/:code/start` and `GET /rooms/:code`.
- Schema tests to preserve player-name and participant validation.
- Frontend API tests for expanded snapshot shape and absence of guesser `secretWord`.
- Frontend build/type validation to ensure optional `secretWord` is handled safely.
- Manual two-tab validation: host/drawer sees word, guesser sees drawer only, both see same playing state.

## Post-Design Constitution Check

- **Brownfield Extension**: PASS. Design extends existing room/game files only.
- **Full-Stack Input Validation**: PASS. Existing name validation is preserved and role-specific access is enforced at backend snapshot generation.
- **Polling-Only Synchronization**: PASS. Playing-state refresh uses HTTP fetch/polling only.
- **Simple Implementation**: PASS. Current round remains in memory on the room; no prohibited infrastructure is introduced.
- **Specification Traceability**: PASS. Model, contracts, and quickstart map to US1-US4 and FR-001 through FR-019.
- **Human Review of AI Output**: PASS. Quickstart includes focused privacy and drawer-flow review steps.
