# Research: Room Setup & Lobby

**Feature**: 001-room-setup-lobby | **Date**: 2026-05-30

## 1. Lobby synchronization mechanism

**Decision**: Use `useEffect` + `setInterval(2000)` in `LobbyPage` calling a silent
`roomStore.fetchRoom()` that does not toggle global `isLoading`.

**Rationale**: Constitution forbids WebSockets. The starter already exposes
`GET /rooms/:code?participantId=` for snapshots. A 2-second interval matches spec SC-003
and README Scenario 1. Cleanup via effect return clears the interval when leaving `/lobby`.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| Manual refresh only | Violates FR-008; spec requires automatic updates |
| Shorter interval (500ms) | Unnecessary load for lab scope; spec targets ~2s |
| Shared polling in RoomStoreProvider | Couples global lifecycle to one page; lobby-only is simpler |

## 2. Host identification in API responses

**Decision**: Persist `hostParticipantId: string` on the internal `Room` model. Expose
`hostParticipantId` on `RoomSnapshot` and derive `isHost: boolean` on each snapshot
participant for lobby rendering.

**Rationale**: Host is fixed at create time (FR-002). A single source field avoids ambiguity
when display names duplicate. Frontend compares `participant.id === room.hostParticipantId`
or uses `participant.isHost` from snapshot.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| First participant always host | Implicit; breaks if ordering changes |
| Separate `hostName` string only | Cannot authorize start action without stable id |
| Role enum on participant | Drawer/guesser roles belong to Scenario 2 |

## 3. Start-game API design

**Decision**: Add `POST /rooms/:code/start` with JSON body `{ participantId: string }`.
Backend validates: room exists, status is `lobby`, caller is host, `participants.length >= 2`.
On success set `status` to `"playing"` and return updated snapshot.

**Rationale**: Matches existing pattern (`participantId` query on GET). Server-side
enforcement satisfies FR-010/FR-011 even if UI is bypassed. Status flip enables all lobby
pollers to navigate to `/game` without a push channel.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| Frontend-only navigation without API | Non-host could navigate; no shared state transition |
| WebSocket broadcast on start | Forbidden by constitution |
| Separate “ready” flags per player | Out of scope; spec requires host-only start |

## 4. Room status transition

**Decision**: Extend `RoomStatus` to `"lobby" | "playing"`. Scenario 2 will add round-level
state; for Scenario 1, `"playing"` means “host started; proceed to game screen.”

**Rationale**: Gives pollers a deterministic signal for navigation (US4 scenario 4). GamePage
redirects to lobby when status is still `"lobby"` (edge case: direct `/game` URL).

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| Keep status `"lobby"` until Scenario 2 | Cannot sync multi-client navigation on start |
| Add `"starting"` intermediate state | Unnecessary for lab; no countdown in scope |

## 5. Join code validation layering

**Decision**: Reject empty/whitespace room codes on the client in `JoinRoomPage` before
fetch. Keep backend case normalization (`toUpperCase()` on code param) as today.

**Rationale**: FR-004 requires rejection without entering lobby; client check avoids useless
network calls. Invalid unknown codes still return 404 from backend (FR-005).

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| Backend-only validation | Poor UX; user waits for round trip for empty input |
| Strict 4-char regex on client | Starter already generates 4-char codes; unknown length rejected by 404 |

## 6. Error messaging for blocked start

**Decision**: Disable start button in UI with inline copy for three states: (a) not host,
(b) fewer than two players, (c) loading. Backend returns `403` with message for unauthorized
start attempts.

**Rationale**: Satisfies FR-012 with visible lobby messaging and safe server enforcement.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| Hide button entirely for non-host | Spec allows disabled state with explanation |
| Toast-only errors | Easy to miss in two-browser testing |
