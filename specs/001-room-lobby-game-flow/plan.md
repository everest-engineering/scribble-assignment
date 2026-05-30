# Implementation Plan: Room Lobby Game Flow

**Branch**: `assignment` | **Date**: 2026-05-30 | **Spec**: `specs/001-room-lobby-game-flow/spec.md`

**Input**: Feature specification from `/specs/001-room-lobby-game-flow/spec.md`

**Note**: This plan captures the existing backend/frontend architecture and delivers the room setup, lobby refresh, game entry, and error handling work requested by the feature spec.

## Summary

Implement the Scribble room lifecycle for room creation, join, lobby polling, game start, single-round drawing/guessing, results, and restart using the existing TypeScript Express backend and React/Vite frontend. Keep the backend memory-only, avoid WebSockets or persistent storage, and sync shared state through HTTP polling.

## Technical Context

**Language/Version**: Node.js + TypeScript on backend and React + TypeScript on frontend.

**Primary Dependencies**: Express, Zod, React 18, React Router v6, Vite, `node:crypto`, Vitest.

**Storage**: In-memory backend room store via `Map<string, Room>`; frontend transient session via `RoomStore` singleton with no browser refresh persistence.

**Testing**: Vitest for backend and frontend unit tests; existing service and schema tests are available.

**Target Platform**: Local web app with browser frontend and Node backend.

**Project Type**: Web application with separate backend and frontend projects.

**Performance Goals**: Reliable lobby refresh under short polling intervals; low-latency user flows with fast client navigation.

**Constraints**: No WebSockets or real-time push; no databases; no authentication; all rooms and session data live in memory only.

**Scale/Scope**: Single-room multiplayer prototyping in-memory; supports small groups joining through a shared room code.

## Constitution Check

No direct constitution violations identified for this scope. The plan adheres to the project constraint of in-memory storage and avoids out-of-scope persistent or real-time protocols.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-lobby-game-flow/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api-endpoints.md
├── checklists/
│   └── requirements.md
└── spec.md
```

### Source Code

```text
backend/
├── package.json
├── tsconfig.json
└── src/
    ├── api/
    │   ├── rooms.ts
    │   ├── router.ts
    │   ├── schemas.ts
    │   └── schemas.test.ts
    ├── models/
    │   └── game.ts
    ├── seed/
    │   └── starterData.ts
    └── services/
        ├── roomStore.ts
        └── roomStore.test.ts

frontend/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── components/
    ├── pages/
    │   ├── CreateRoomPage.tsx
    │   ├── JoinRoomPage.tsx
    │   ├── LobbyPage.tsx
    │   ├── GamePage.tsx
    │   └── StartPage.tsx
    ├── routes/
    ├── services/
    │   └── api.ts
    └── state/
        └── roomStore.ts
```

**Structure Decision**: Use the existing backend/frontend split. Backend handles room lifecycle APIs and shared models. Frontend handles user flows, lobby refresh, and room session state in `RoomStore`.

## Key Endpoints

- `POST /rooms`
  - Creates a new room.
  - Request: `{ playerName?: string }`
  - Response: `{ participantId, room: RoomSnapshot }`

- `POST /rooms/:code/join`
  - Joins an existing room by uppercase-normalized code.
  - Request: `{ playerName?: string }`
  - Response: `{ participantId, room: RoomSnapshot }`
  - Error: `404` if room not found.

- `GET /rooms/:code?participantId=...`
  - Refreshes lobby state.
  - Response: `{ room: RoomSnapshot }`
  - Error: `404` if room not found.

- `POST /rooms/:code/start`
  - Host-only game start with a 2-player minimum.
  - Request: `{ participantId }`
  - Response: `{ room: RoomSnapshot }`

- `PUT /rooms/:code/drawing`
  - Drawer-only drawing update.
  - Request: `{ participantId, drawing }`
  - Response: `{ room: RoomSnapshot }`

- `POST /rooms/:code/drawing/clear`
  - Drawer-only drawing clear.
  - Request: `{ participantId }`
  - Response: `{ room: RoomSnapshot }`

- `POST /rooms/:code/guesses`
  - Guesser-only trimmed guess submission.
  - Request: `{ participantId, text }`
  - Response: `{ room: RoomSnapshot }`

- `POST /rooms/:code/restart`
  - Host-only restart from results to lobby.
  - Request: `{ participantId }`
  - Response: `{ room: RoomSnapshot }`

## Data Model

- `Room`: `code`, `status`, `hostId`, `participants`, `round`, `createdAt`, `updatedAt`.
- `Participant`: `id`, `name`, `joinedAt`.
- `RoundState`: deterministic `drawerId`, deterministic `secretWord`, drawing payload, guesses, scores, and result summary.
- `RoomSnapshot`: viewer-safe `code`, `status`, `hostId`, `participants`, `drawerId`, conditional `secretWord`, drawing, guesses, scores, result summary, `availableWords`, `roles`.
- `Room Session`: `participantId` + `room` snapshot stored only in frontend memory for the current tab lifecycle.

## Out-of-Scope Notes

- Multiple rounds, drawer rotation, timers, bonus scoring, authentication, persistent sessions, databases, and WebSockets are not part of this feature.

## Phased Work

### Phase 0: Research

- Confirm the in-memory backend room store and HTTP polling lobby refresh model.
- Confirm room code normalization to uppercase and empty trimmed player-name rejection.
- Confirm host-only start with a two-player minimum.
- Confirm invalid room joins and validation errors are surfaced clearly and form values are preserved.

### Phase 1: Design

- Define backend room entities and schema validation with Zod.
- Align `RoomSnapshot` payloads with frontend expectations.
- Define frontend session contract for `createRoom`, `joinRoom`, and `fetchRoom`.
- Document the API contract for room lifecycle endpoints.
- Confirm that the frontend room store preserves `participantId` and room snapshot across in-app navigation only, not browser refresh.

### Phase 2: Implementation

1. Room setup
   - Add or validate backend `POST /rooms` create-room flow.
   - Validate room code generation and uppercase normalization.
   - Trim `playerName` and reject empty values with a clear validation error.

2. Join room flow
   - Implement `POST /rooms/:code/join` with room existence checking.
   - Preserve entered join form values on error.
   - Normalize join code to uppercase.

3. Lobby polling and refresh
   - Use `GET /rooms/:code?participantId=` to refresh lobby state.
   - Update `LobbyPage` to display current participants and last refresh status.
   - Surface request errors as retryable UI messages.

4. Game start navigation
   - Preserve `RoomStore` state when navigating from lobby to `/game`.
   - Protect `/lobby` and `/game` by redirecting to `/` when no room snapshot exists.
   - Call the backend start endpoint and navigate to `/game` only after successful host-only validation.

5. Drawer/guessing/scoring/results/restart
   - Render drawer-only word visibility and drawing controls.
   - Sync drawing, guesses, scores, and result state through polling.
   - Submit guesses with trimmed non-empty validation and deterministic scoring.
   - Show shared results and host-only restart to lobby with players preserved and round state cleared.

6. Error handling and UX
   - Ensure invalid join attempts return user-friendly errors.
   - Ensure the lobby refresh button is disabled while loading.
   - Ensure room state is preserved across lobby/game navigation.

### Validation

- Verify room creation flows to lobby and displays the new room code.
- Verify join flow adds a second participant and updates the lobby list.
- Verify lobby refresh requests the latest room snapshot and updates UI.
- Verify direct access to `/lobby` or `/game` without session state redirects to `/`.
- Verify invalid room joins show a recoverable error and preserve form input.
