# Research: Room Lobby Access

## 1. In-Memory Room Isolation

- Decision: Keep one backend `Map<string, Room>` keyed by room code and always
  return cloned room snapshots to callers.
- Rationale: A code-keyed map makes room boundaries explicit and avoids shared
  mutation across rooms. Cloning on read keeps one room's updates from leaking
  into another room's view.
- Alternatives considered:
  - Shared list plus filters: rejected because it invites accidental cross-room
    writes and harder-to-audit state access.
  - Persistent storage: rejected by constitution and feature scope.

## 2. Lobby Refresh Strategy

- Decision: Keep the frontend polling the room snapshot endpoint on a 2000 ms
  interval while the participant remains on the room page. Stop polling when
  the user navigates away or closes the tab.
- Rationale: The project explicitly forbids push transport, and the existing
  `roomStore.ts` already supports fetching snapshots by room code plus
  participant identifier.
- Alternatives considered:
  - WebSockets or SSE: rejected by constitution.
  - Manual refresh only: rejected because the acceptance criteria require
    automatic lobby updates.

## 3. Host Departure Handling

- Decision: If the host leaves before the game starts, delete the room on the
  backend and let the frontend redirect remaining participants home when the
  next poll returns 404.
- Rationale: This keeps room state isolated, avoids orphaned lobby state, and
  uses the existing polling flow instead of adding push transport.
- Alternatives considered:
  - Keep the room open with no host: rejected because the room would be stuck
    without a valid start owner.
  - Auto-promote another participant: rejected because the feature only defines
    the creator as host.

## 4. Host-Only Start Gate

- Decision: Add an explicit start-room action that is authorized by the
  caller's `participantId` and validated against the room's recorded host. The
  lobby exposes a `Start Game` button for the host, and a successful click
  starts the game immediately and advances to the first round.
- Rationale: There is no authentication layer, so the only stable identity in
  the current design is the participant record returned at room creation or
  join time.
- Alternatives considered:
  - Derive host from browser-local state: rejected because it is easy to lose
    and cannot support multi-tab validation.
  - First participant inferred on demand: rejected because host identity must
    stay explicit and deterministic.

## 5. Room State Transition Model

- Decision: Extend room status from `lobby` to `game` when the host starts the
  room and at least two participants are present.
- Rationale: A discrete status keeps the start gate testable and leaves a clear
  handoff point for later gameplay features.
- Alternatives considered:
  - Boolean started flag: rejected because it scales poorly once more states are
    added.
  - Implicit status from participant count alone: rejected because it cannot
    represent the post-start game state.

## 6. Frontend State Integration

- Decision: Keep the existing `roomStore.ts` pattern and extend the current API
  wrapper instead of introducing a new state library.
- Rationale: The store already centralizes room session state, loading, and
  polling behavior.
- Alternatives considered:
  - Zustand rewrite: rejected because the starter already has an established
    store pattern.
  - Local component state only: rejected because cross-page room state needs to
    survive navigation inside the session.
