# Research: Scenario 4 Result State and Restart

## Decision: Model post-round review as a third room status

**Rationale**: Scenario 4 needs a room-wide state that is neither lobby nor
active play. Extending the existing room status to include `results` preserves
the same room lifecycle, keeps polling behavior unchanged, and avoids creating
an archived-results store or separate result session object.

**Alternatives considered**:

- Infer results from `playing` plus a hidden round-ended flag
  Rejected because the client and routes still need a first-class state change
  for permissions and navigation.
- Create a second room-like result entity
  Rejected because it duplicates room identity and complicates restart.

## Decision: End the round inside correct guess submission

**Rationale**: The first correct accepted guess is the only specified round-end
trigger. Performing score update, winning guess append, and `playing -> results`
transition in one backend mutation keeps result snapshots deterministic and
prevents transient states where a guess is marked correct but the room has not
yet ended.

**Alternatives considered**:

- End the round in a separate follow-up action
  Rejected because it introduces a race between scoring and result transition.
- End the round on a timer
  Rejected because timers are explicitly out of scope.

## Decision: Preserve completed round data on the room until restart

**Rationale**: Result state requires the correct word, final scores, and full
guess history to remain visible to all players after play stops. Keeping the
completed round on `room.round` preserves one authoritative snapshot for polling
clients and makes restart cleanup a single reset operation.

**Alternatives considered**:

- Copy final results into a separate summary object and discard the round
  Rejected because it duplicates state and adds translation logic without user
  value.
- Hide the round immediately after the correct guess
  Rejected because it prevents players from reviewing the completed outcome.

## Decision: Add a host-only restart action on the existing rooms API

**Rationale**: Restart is a room-scoped permissioned mutation, just like start,
drawing, clearing, and guessing. Adding `POST /rooms/{code}/restart` keeps room
lookup, participant checks, and snapshot responses consistent with the existing
API design.

**Alternatives considered**:

- Restart by creating a new room
  Rejected because the specification requires preserving room code and roster.
- Restart through a frontend-only state reset
  Rejected because multiplayer state must remain backend-authoritative.

## Decision: Extend the viewer-specific room snapshot instead of creating a separate result payload

**Rationale**: The frontend already depends on one viewer-specific `RoomSnapshot`
for lobby and gameplay flows. Extending that snapshot with `results`,
`canRestartGame`, and shared word visibility keeps the client contract simple
and ensures fetch, guess, and restart responses all converge on the same shape.

**Alternatives considered**:

- Add a separate `/results` fetch payload
  Rejected because the client would need to coordinate multiple polling shapes
  for one room.
- Keep result permissions implicit in frontend logic only
  Rejected because restart permission should remain explicit and backend-driven.

## Decision: Reuse the existing game route for results and the existing lobby route after restart

**Rationale**: Scenario 4 adds a new state to the same room flow, not a new top-
level product surface. Rendering `playing` and `results` from `GamePage` keeps
the route graph stable, minimizes state duplication, and allows the existing
post-restart redirect back to lobby to stay simple.

**Alternatives considered**:

- Add a dedicated `/results` route
  Rejected because it adds route branching without new scenario value.
- Keep users on the lobby page during results
  Rejected because result review is an extension of the active round, not lobby
  setup.

## Decision: Keep synchronization as action-response plus polling

**Rationale**: The acting tab should see result and restart changes immediately
from the action response, while other tabs catch up through the existing
polling interval. This preserves acceptable responsiveness and remains fully
within the polling-only constitution constraint.

**Alternatives considered**:

- Wait for polling even on the acting tab
  Rejected because it adds unnecessary delay to obvious state changes.
- Introduce push-based result notifications
  Rejected because realtime transport is forbidden.
